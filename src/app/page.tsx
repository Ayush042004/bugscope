'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Globe, 
  Smartphone, 
  Wifi, 
  Cloud, 
  Brain, 
  Network,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Target,
  Zap,
  Lock,
  Eye,
  Search,
  Bug,
  Award,
  TrendingUp,
  Code,
  Database,
  Server
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Shield,
    title: 'Comprehensive Security Testing',
    description: 'Complete checklists for web, API, mobile, IoT, cloud, and AI security testing',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Brain,
    title: 'AI-Powered Suggestions',
    description: 'Get intelligent recommendations based on your testing scope and progress',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Target,
    title: 'Progress Tracking',
    description: 'Visual progress tracking with detailed analytics and completion metrics',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Code,
    title: 'Export & Reporting',
    description: 'Export findings in multiple formats: Markdown, CSV, JSON, and PDF',
    color: 'from-orange-500 to-red-500'
  }
];

const scopes = [
  { icon: Globe, name: 'Web Application', count: '45+ checks' },
  { icon: Network, name: 'API Security', count: '38+ checks' },
  { icon: Smartphone, name: 'Mobile Security', count: '42+ checks' },
  { icon: Wifi, name: 'IoT Security', count: '35+ checks' },
  { icon: Cloud, name: 'Cloud Security', count: '40+ checks' },
  { icon: Brain, name: 'AI/LLM Security', count: '28+ checks' },
  { icon: Server, name: 'Network Security', count: '33+ checks' },
  { icon: Database, name: 'Database Security', count: '31+ checks' }
];

const stats = [
  { icon: Users, value: '10,000+', label: 'Security Researchers' },
  { icon: Bug, value: '50,000+', label: 'Vulnerabilities Found' },
  { icon: Award, value: '99.9%', label: 'Success Rate' },
  { icon: TrendingUp, value: '24/7', label: 'Platform Uptime' }
];

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
    
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-white/10 text-white border-white/20">
              <Star className="h-4 w-4 mr-2" />
              Trusted by 10,000+ Security Researchers
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Next-Gen Security
              <br />
              Testing Platform
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Revolutionize your bug bounty hunting with AI-powered suggestions, comprehensive checklists, 
              and advanced analytics. Find vulnerabilities faster than ever before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-in">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-6">
                    Start Testing Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
             
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Powerful Features for Security Professionals
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to conduct thorough security assessments and find critical vulnerabilities
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                  <CardContent className="p-8">
                    <motion.div
                      animate={{ 
                        scale: hoveredFeature === index ? 1.1 : 1,
                        rotate: hoveredFeature === index ? 5 : 0
                      }}
                      className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Scopes */}
      <section className="py-20 px-6 bg-white/5">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Comprehensive Security Coverage
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Test across all major security domains with our extensive checklist library
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scopes.map((scope, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <scope.icon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{scope.name}</h3>
                    <p className="text-gray-400 text-sm">{scope.count}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 mb-4"
                >
                  <stat.icon className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Ready to Elevate Your Security Testing?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of security researchers who trust BugScope for their vulnerability assessments
            </p>
              <Link href="/sign-up">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-12 py-6">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                BugScope
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 BugScope. All rights reserved. Securing the digital world, one bug at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}