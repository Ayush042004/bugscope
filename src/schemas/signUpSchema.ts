import {z} from "zod";
import { usernameValidation } from "./userNameSchema";
import { isAllowedEmail } from "@/lib/email";

export const signUpSchema = z.object({
    username: usernameValidation,
    email: z.string().email({message: "Invalid email address"}).refine((val)=> isAllowedEmail(val), { message: 'Email domain not allowed' }),
    password:z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),

})