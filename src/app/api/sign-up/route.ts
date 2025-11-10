import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import sanitize from "mongo-sanitize";
import { SignUpSchema } from "@/lib/validation";


export async function POST(request: NextRequest){
    await dbConnect();
    try {
        const body = await request.json();
        const parsed = SignUpSchema.safeParse(body);
        if (!parsed.success) {
            return Response.json({ success: false, message: parsed.error.flatten() }, { status: 400 });
        }

        const { username, email, password } = parsed.data;
        const safeUsername = sanitize(username);

        const existingUserByUsername = await UserModel.findOne({ username: safeUsername });
        if (existingUserByUsername) {
            return Response.json({ success: false, message: "Username is already taken" }, { status: 400 });
        }

        const existingUserByEmail = await UserModel.findOne({ email });
        if (existingUserByEmail) {
            return Response.json({ success: false, message: "User already exists with this email! Try another" }, { status: 400 });
        }

        const idx = Math.floor(Math.random() * 100) + 1;
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new UserModel({
            username: safeUsername,
            email,
            password: hashedPassword,
            avatar: randomAvatar,
        });
        await newUser.save();
        return Response.json({ success: true, message: "User registered successfully!" }, { status: 201 });
    } catch (error) {
        console.error("Error registering user: ", error);
        return Response.json({ success: false, message: "Registration failed" }, { status: 500 });
    }
}