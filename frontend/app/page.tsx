"use client"; 
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
export default function Home() {
  const handleLogin = () => {
    // Redirect to your Flask backend's /login endpoint
    window.location.replace('http://localhost:5000/login');
  };
  useEffect(() => {
    // Extract token from URL fragment
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const token = params.get('token')
  
    if (token) {
      sessionStorage.setItem('access_token', token)
      window.history.replaceState(null, '', '/dashboard')
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"
    >
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.h1 
          className="text-6xl font-bold text-gray-900 mb-4"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          Your Music Stats
        </motion.h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover your listening habits with Spotify
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={handleLogin}
            className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700"
          >
            Login with Spotify
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}