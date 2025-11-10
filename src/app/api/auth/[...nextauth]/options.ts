import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

interface CustomUser {
  id: string;
  _id?: string;
  email: string;
  username: string;
  avatar?: string;
  password?: string;
}


// --- Simple in-memory login attempt tracker (process lifetime only) ---
const loginAttempts: Map<string, { count: number; firstAttempt: number }> = new Map();
const MAX_ATTEMPTS = 5; // attempts per window
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Precomputed dummy hash to normalize timing for invalid users (avoid user enumeration)
const DUMMY_HASH = bcrypt.hashSync('invalid-password-baseline', 10);

function registerFailedAttempt(key: string) {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return;
  }
  // Reset window if expired
  if (now - rec.firstAttempt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    rec.count += 1;
  }
}

function isRateLimited(key: string) {
  const rec = loginAttempts.get(key);
  if (!rec) return false;
  const now = Date.now();
  if (now - rec.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function resetAttempts(key: string) {
  loginAttempts.delete(key);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Runtime type guards (defensive): ensure primitives only
        if (
          !credentials ||
          typeof credentials.identifier !== 'string' ||
          typeof credentials.password !== 'string' ||
          credentials.identifier.length === 0 ||
          credentials.password.length === 0
        ) {
          throw new Error('Invalid credentials');
        }
        const identifier = credentials.identifier.trim().toLowerCase();
        const attemptKey = `cred:${identifier}`;
        if (isRateLimited(attemptKey)) {
          throw new Error('Too many attempts. Please wait and try again.');
        }

        await dbConnect();
        try {
          const user = await UserModel.findOne({
            $or: [
              { email: identifier },
              { username: identifier },
            ],
          });

          // If user not found, still perform a bcrypt compare against dummy hash to equalize timing
          if (!user) {
            await bcrypt.compare(credentials.password, DUMMY_HASH);
            registerFailedAttempt(attemptKey);
            throw new Error('Invalid credentials');
          }

            const isPasswordCorrect = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (!isPasswordCorrect) {
              registerFailedAttempt(attemptKey);
              throw new Error('Invalid credentials');
            }

            // success
            resetAttempts(attemptKey);
            const userId = (user._id as { toString: () => string }).toString();
            return {
              id: userId,
              _id: userId,
              username: user.username,
              email: user.email,
              image: user.avatar || null,
            };
        } catch {
          // All errors map to generic message (except rate limit handled earlier)
          throw new Error('Invalid credentials');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
async jwt({ token, user, account }) {
  if (account?.provider === 'google') {
    await dbConnect();

    let dbUser = await UserModel.findOne({ email: user.email });

    if (!dbUser) {
      // Hash a sentinel password instead of storing plaintext marker
      const sentinelHash = await bcrypt.hash('GOOGLE_OAUTH_SENTINEL', 10);
      dbUser = await UserModel.create({
        email: user?.email,
        username: user?.name || (user.email ? user.email.split('@')[0] : ''),
        password: sentinelHash,
      });
    }

    token._id = (dbUser._id as { toString: () => string }).toString();
    token.username = dbUser.username;
  } else if (user) {
    const customUser = user as CustomUser;
    token._id = customUser._id?.toString?.();
    token.username = customUser.username;
  }

  return token;
},

    async session({ session, token }) {
      if (token) {
        session.user._id = token._id as string | undefined;
        session.user.username = typeof token.username === 'string' ? token.username : undefined;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
};