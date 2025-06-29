'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaFileAlt, FaMagic, FaHeart, FaEnvelope } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

// Sparkle component for menu items
const Sparkle = () => (
  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-accent-500 to-accent-900 opacity-0 group-hover:opacity-100 transition-opacity" />
);

// Cupid arrow that follows mouse
const CupidArrow = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-50 text-primary-500 text-xl"
      style={{ 
        left: position.x + 20, 
        top: position.y - 10,
        opacity: isVisible ? 1 : 0,
        rotate: 45
      }}
      animate={{ scale: [1, 1.2, 1], rotate: [45, 55, 45] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <FaHeart />
    </motion.div>
  );
};

export default function Header({ className }: HeaderProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const scale = useTransform(scrollY, [0, 100], [1, 0.95]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <CupidArrow />
      
      <motion.header 
        className={cn(
          'fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between p-4 md:p-6 bg-white/80 backdrop-blur-md rounded-full shadow-lg',
          className
        )}
        style={{ opacity, scale }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="flex items-center space-x-2">
          <motion.div 
            className="bg-primary-500 p-2 rounded-full"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <FaHeart className="text-white text-xl" />
          </motion.div>
          <Link href="/" className="font-cursive text-2xl font-bold text-primary-500 hover:text-primary-600 transition-colors">
            AGAM
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          {[
            { href: '/convert', icon: <FaFileAlt />, label: 'Convert' },
            { href: '/merge', icon: <FaMagic />, label: 'Merge' },
            { href: '/images-to-pdf', icon: <FaEnvelope />, label: 'Images to PDF' }
          ].map((item, index) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="group relative flex items-center space-x-1 font-cursive text-primary-500 hover:text-primary-700 transition-colors"
            >
              <motion.span 
                className="flex items-center space-x-1"
                whileHover={{ 
                  scale: 1.1,
                  transition: { type: 'spring', stiffness: 300 }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.span>
              <Sparkle />
            </Link>
          ))}
        </nav>
        
        <div className="md:hidden">
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-primary-500"
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
        </div>
      </motion.header>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div 
          className="fixed inset-0 z-30 bg-white/95 flex flex-col items-center justify-center space-y-8 p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: '100vh' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <motion.button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-6 right-6 p-2 text-primary-500"
            whileTap={{ scale: 0.9 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
          
          {[
            { href: '/convert', icon: <FaFileAlt className="text-xl" />, label: 'Convert' },
            { href: '/merge', icon: <FaMagic className="text-xl" />, label: 'Merge' },
            { href: '/images-to-pdf', icon: <FaEnvelope className="text-xl" />, label: 'Images to PDF' }
          ].map((item, index) => (
            <motion.div
              key={item.href}
              className="love-letter w-64 p-4 flex flex-col items-center"
              initial={{ opacity: 0, y: 20, rotateZ: -5 }}
              animate={{ opacity: 1, y: 0, rotateZ: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateZ: 5 }}
            >
              <Link 
                href={item.href} 
                className="font-cursive text-xl text-primary-500 flex flex-col items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                <span className="mt-2">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
} 
 