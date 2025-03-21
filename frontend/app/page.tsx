"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SignIn from '@/components/signIn';
import { SignUp } from '@/components/signUp'; // Assuming you have these components
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="py-20 text-center"
      >
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Your Music Stats, Simplified
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track your Spotify listening habits and discover your top artists, tracks, and more.
        </p>
        <div className="space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Sign In</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign In</DialogTitle>
                <DialogDescription>
                  Enter your credentials to sign in.
                </DialogDescription>
              </DialogHeader>
              <SignIn />
              <DialogFooter>
                <Button onClick={() => setIsSignInOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Sign Up</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign Up</DialogTitle>
                <DialogDescription>
                  Create a new account to get started.
                </DialogDescription>
              </DialogHeader>
              <SignUp />
              <DialogFooter>
                <Button onClick={() => setIsSignUpOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-16 bg-white"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Top Artists',
                description: 'Discover your most-listened-to artists over time.',
                icon: '🎤',
              },
              {
                title: 'Top Tracks',
                description: 'See your favorite tracks and how often you play them.',
                icon: '🎵',
              },
              {
                title: 'Personalized Stats',
                description: 'Get insights into your listening habits and trends.',
                icon: '📊',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <span>{feature.icon}</span>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-20 text-center bg-gray-900 text-white"
      >
        <h2 className="text-4xl font-bold mb-4">
          Ready to Dive In?
        </h2>
        <p className="text-xl mb-8">
          Sign up now to start exploring your music stats.
        </p>
        <div className="space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Sign In</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign In</DialogTitle>
                <DialogDescription>
                  Enter your credentials to sign in.
                </DialogDescription>
              </DialogHeader>
              <SignIn />
              <DialogFooter>
                <Button onClick={() => setIsSignInOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Sign Up</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign Up</DialogTitle>
                <DialogDescription>
                  Create a new account to get started.
                </DialogDescription>
              </DialogHeader>
              <SignUp />
              <DialogFooter>
                <Button onClick={() => setIsSignUpOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="py-8 text-center bg-gray-800 text-white">
        <p className="text-sm">
          © Made for Modern Web Development Module: Marcus, Kay, Pedro and Dami</p>
        <div className="mt-4 space-x-4">
          <a href="#" className="text-sm hover:underline">Terms</a>
          <a href="#" className="text-sm hover:underline">Privacy</a>
        </div>
      </footer>
    </div>
  );
}