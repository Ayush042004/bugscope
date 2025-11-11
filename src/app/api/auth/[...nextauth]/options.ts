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
        if (!credentials || !credentials.identifier || !credentials.password) {
          throw new Error('Invalid credentials');
        }

        await dbConnect();

        const identifier = String(credentials.identifier).trim().toLowerCase();
        const user = await UserModel.findOne({
          $or: [
            { email: identifier },
            { username: identifier },
          ],
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordCorrect = await bcrypt.compare(String(credentials.password), user.password);
        if (!isPasswordCorrect) {
          throw new Error('Invalid credentials');
        }

        const userId = (user._id as { toString: () => string }).toString();
        const authedUser: Pick<CustomUser, 'id' | '_id' | 'username' | 'email' | 'avatar'> & { image: string | null } = {
          id: userId,
          _id: userId,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          image: user.avatar || null,
        };
        return authedUser;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user?.email) {
        await dbConnect();
        let dbUser = await UserModel.findOne({ email: user.email });
        if (!dbUser) {
          const sentinelHash = await bcrypt.hash('GOOGLE_OAUTH_SENTINEL', 10);
          dbUser = await UserModel.create({
            email: user.email,
            username: user.name || user.email.split('@')[0],
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