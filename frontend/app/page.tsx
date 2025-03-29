"use client";
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  useEffect(() => {
    // Check if we're returning from the callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      setLoading(true);
      
      // Call our backend with the code
      fetch(`http://localhost:5000/callback${window.location.search}`, {
        method: 'GET',
        credentials: 'include', // Important for cookies
      })
        .then(response => {
          // Check if the response is JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json().then(data => {
              if (data.status === "success" && data.redirect_url) {
                // Clear URL parameters
                window.history.replaceState({}, document.title, '/');
                
                // Redirect to the dashboard
                window.location.href = data.redirect_url;
              } else {
                setError("Authentication failed");
                setLoading(false);
              }
            });
          } else {
            // Handle case where response might not be JSON
            setError("Unexpected response format");
            setLoading(false);
          }
        })
        .catch(err => {
          setError("Error during authentication");
          console.error(err);
          setLoading(false);
        });
    }
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Authenticating with Spotify...</p>
      </div>
    );
  }

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
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleLogin}
            className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            Login with Spotify
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}