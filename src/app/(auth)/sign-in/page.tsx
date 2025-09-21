"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { signInSchema } from "@/schemas/signInSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";

function Page() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    const result = await signIn("credentials", {
      redirect: false,
      identifier: data.identifier,
      password: data.password,
    });
    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        toast("Invalid credentials. Please try again.", { icon: "❌" });
      } else {
        toast("An unexpected error occurred. Please try again later.", { icon: "❌" });
      }
    }
    if (result?.url) router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#152316] rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0f1711] rounded-full blur-3xl opacity-70"></div>
      </div>

      <div className="relative w-full max-w-md z-10 mt-10 mb-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-9 ">
          <Link href="/">
            <Button variant="ghost" className="text-[#b6f09c] hover:bg-[#152316] p-0">
              <ArrowLeft className="h-4 w-4 mr-2 text-[#87cf5f]" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="flex justify-center mb-4">
            <Image src="/bugscope.svg" alt="BugScope" width={100} height={100} />
            </motion.div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b6f09c] to-[#86db6d] bg-clip-text text-transparent text-center">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-center mt-2">Sign in to continue your journey with BugScope</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email / Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-[#87cf5f]" />
                          <Input
                            {...field}
                            placeholder="Enter your email or username"
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#87cf5f] focus-visible:border-[#2d4a25]/60"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-[#87cf5f]" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#87cf5f] focus-visible:border-[#2d4a25]/60"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-[#87cf5f] hover:opacity-80"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#8bd46a] to-[#2db08d] hover:from-[#79c85c] hover:to-[#249e7f] text-white font-semibold py-3 rounded-xl shadow-lg"
                  >
                    Sign In
                  </Button>
                </motion.div>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black px-4 text-gray-400">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="group w-full h-12 justify-center rounded-xl border border-[#1f2d20] bg-[#0b1015] text-white/90 text-sm font-medium transition-all hover:bg-[#152316] hover:border-[#2d4a25] hover:text-[#b6f09c] focus-visible:ring-1 focus-visible:ring-[#87cf5f]"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <Image src="/google.svg" alt="Google" width={20} height={20} className="mr-3" />
              <span className="transition-colors group-hover:text-[#b6f09c]">Continue with Google</span>
            </Button>

            <div className="text-center mt-6">
              <p className="text-gray-400">
                Not a verified member yet?{" "}
                <Link href="/sign-up" className="text-[#b6f09c] hover:text-[#a0e67f] font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Page;
