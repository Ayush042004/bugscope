'use client';

import React, { useState } from 'react';
import toast from "react-hot-toast";
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { signUpSchema } from '@/schemas/signUpSchema';
import axios, { AxiosError } from "axios";
import { ApiResponse } from '@/types/ApiResponse';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

function SignUpPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", email: "", password: "" }
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ApiResponse>('/api/sign-up', data);
      toast.success(response.data.message);
      router.replace('/dashboard');
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage = axiosError.response?.data.message;
      toast.error(errorMessage ?? 'There was a problem with your sign-up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-20 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#152316] rounded-full blur-3xl opacity-70"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0f1711] rounded-full blur-3xl opacity-70"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-[#b6f09c] hover:bg-[#152316] p-0">
              <ArrowLeft className="h-4 w-4 mr-2 text-[#87cf5f]" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl shadow-xl">
            <CardHeader className="text-center pb-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="flex justify-center mb-4">
                <Image src="/bugscope.svg" alt="BugScope" width={100} height={100} />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#b6f09c] to-[#86db6d] bg-clip-text text-transparent">
                Join BugScope
              </CardTitle>
              <p className="text-gray-400 mt-2">Sign up to start your journey with BugScope</p>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-[#87cf5f]" />
                            <Input
                              placeholder="Choose a unique username"
                              {...field}
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-[#87cf5f]" />
                            <Input
                              placeholder="Enter your email"
                              {...field}
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
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a secure password"
                              {...field}
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
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#8bd46a] to-[#2db08d] hover:from-[#79c85c] hover:to-[#249e7f] text-white font-semibold py-3 rounded-xl"
                    >
                      {isSubmitting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Already a member?{' '}
                  <Link href="/sign-in" className="text-[#b6f09c] hover:text-[#a0e67f] font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default SignUpPage;
