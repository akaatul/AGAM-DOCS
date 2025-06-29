'use client';

import { motion } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  return (
    <footer className={cn(
      'mt-auto p-8 bg-gradient-to-r from-primary-100 to-primary-200 text-center text-primary-700 relative overflow-hidden',
      className
    )}>
      {/* Decorative hearts */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div 
            key={i}
            className="absolute text-primary-300"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              opacity: 0.3,
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <FaHeart />
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          className="mb-4 flex justify-center"
          whileHover={{ scale: 1.1 }}
        >
          <div className="heart inline-block w-6 h-6 mr-2"></div>
          <span className="font-cursive text-xl">Made with Love</span>
          <div className="heart inline-block w-6 h-6 ml-2"></div>
        </motion.div>

        <p className="font-cursive">&copy; {new Date().getFullYear()} AGAM - File Conversion & Merging. All rights reserved.</p>
        
        <motion.p 
          className="text-sm mt-4 ribbon-border inline-block px-4 py-2"
          whileHover={{ scale: 1.05 }}
        >
          Supported formats: DOCX, PPTX, XLSX, TXT, PNG, JPG, JPEG, PDF
        </motion.p>
      </div>
    </footer>
  );
} 