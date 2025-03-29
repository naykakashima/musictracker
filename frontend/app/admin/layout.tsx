"use client"; 

import React from 'react'
import { motion } from 'framer-motion';

const admin = ({ children }: { children: React.ReactNode }) => {
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
          Admin Dashboard
        </motion.h1>
        <p className="text-xl text-gray-600 mb-8">
          Monitor your users and Data
        </p>
        {children}
      </div>
    </motion.div>
           
    
  )
}

export default admin