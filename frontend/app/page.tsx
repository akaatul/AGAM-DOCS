'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { FaFilePdf, FaFileWord,FaFilePowerpoint, FaHeart} from 'react-icons/fa';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// import FileDropzone from '@/components/FileDropzone';
import Button from '@/components/Button';
// import FileCard from '@/components/FileCard';
// import { convertToPdf, convertPdfToDocx, convertPdfToTxt, ProcessedFile, convertPdfToPptx} from '@/lib/api';
// import { getFileExtension } from '@/lib/utils';
// import toast from 'react-hot-toast';

// Floating hearts background
const HeartBackground = () => {
  const hearts = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 20 + 10,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
  }));

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-primary-100"
          style={{
            fontSize: heart.size,
            left: `${heart.left}%`,
            top: -50,
          }}
          animate={{
            y: ['0vh', '100vh'],
            x: [0, Math.random() * 50 - 25],
            rotate: [0, 360],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <FaHeart />
        </motion.div>
      ))}
    </div>
  );
};

// Rose petals falling animation
const RosePetals = () => {
  const petals = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 15 + 5,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="rose-petal"
          style={{
            width: petal.size,
            height: petal.size,
            left: `${petal.left}%`,
            top: -30,
            transform: `rotate(${petal.rotate}deg)`,
          }}
          animate={{
            y: ['0vh', '100vh'],
            x: [0, Math.random() * 100 - 50],
            rotate: [petal.rotate, petal.rotate + 360],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// Love birds animation
const LoveBirds = () => {
  return (
    <motion.div
      className="absolute top-20 right-10 text-primary-400 text-4xl"
      initial={{ x: '100vw' }}
      animate={{ 
        x: [null, '0vw', '-10vw', '-20vw', '-100vw'],
        y: [null, '10vh', '5vh', '15vh', '20vh'],
      }}
      transition={{ 
        duration: 15,
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 10
      }}
    >
      <motion.div 
        animate={{ 
          y: [0, -10, 0, -5, 0],
          rotate: [0, 5, 0, -5, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity
        }}
      >
        <span role="img" aria-label="Love Birds">🕊️ 🕊️</span>
      </motion.div>
    </motion.div>
  );
};

// Floating heart balloons with parallax
const HeartBalloons = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -200]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute left-[10%] top-[30%]"
        style={{ y: y1 }}
      >
        <div className="relative">
          <div className="heart w-16 h-16"></div>
          <div className="absolute bottom-0 left-1/2 w-0.5 h-20 bg-primary-300"></div>
        </div>
      </motion.div>
      
      <motion.div
        className="absolute left-[80%] top-[20%]"
        style={{ y: y2 }}
      >
        <div className="relative">
          <div className="heart w-12 h-12"></div>
          <div className="absolute bottom-0 left-1/2 w-0.5 h-16 bg-primary-300"></div>
        </div>
      </motion.div>
      
      <motion.div
        className="absolute left-[50%] top-[40%]"
        style={{ y: y3 }}
      >
        <div className="relative">
          <div className="heart w-20 h-20"></div>
          <div className="absolute bottom-0 left-1/2 w-0.5 h-24 bg-primary-300"></div>
        </div>
      </motion.div>
    </div>
  );
};

// Animated butterflies
const Butterflies = () => {
  const butterflies = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    size: Math.random() * 10 + 15,
    top: Math.random() * 80 + 10,
    left: Math.random() * 80 + 10,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {butterflies.map((butterfly) => (
        <motion.div
          key={butterfly.id}
          className="absolute text-secondary-300"
          style={{
            fontSize: butterfly.size,
            top: `${butterfly.top}%`,
            left: `${butterfly.left}%`,
          }}
          animate={{
            x: [0, 10, 20, 10, 0, -10, -20, -10, 0],
            y: [0, -5, -10, -5, 0, 5, 10, 5, 0],
          }}
          transition={{
            duration: 10,
            delay: butterfly.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <span role="img" aria-label="Butterfly">🦋</span>
        </motion.div>
      ))}
    </div>
  );
};

// Feature card with heart shape and ribbon
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <motion.div
    className="relative p-8 bg-white shadow-xl rounded-2xl border-2 border-primary-200 ribbon-border overflow-hidden"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <motion.div 
      className="absolute -top-6 left-1/2 transform -translate-x-1/2"
      whileHover={{ rotate: [0, -5, 5, -5, 0] }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white">
        <Icon className="w-6 h-6" />
      </div>
    </motion.div>
    
    <div className="mt-8 text-center">
      <h3 className="text-xl font-bold mb-2 font-cursive text-primary-600">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
    
    <motion.div 
      className="absolute -right-2 -bottom-2 text-primary-200 text-2xl"
      animate={{ rotate: [0, 10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <FaHeart />
    </motion.div>
  </motion.div>
);

// Heart-shaped testimonial card
interface TestimonialCardProps {
  name: string;
  role: string;
  content: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ name, role, content }) => (
  <motion.div
    className="relative bg-white p-6 rounded-3xl shadow-lg border-2 border-primary-200"
    whileHover={{ scale: 1.05, rotate: -1 }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="absolute -top-4 -right-4 text-primary-300 text-2xl">
      <FaHeart />
    </div>
    
    <p className="text-gray-600 mb-4">{content}</p>
    
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-primary-100 mr-3 overflow-hidden">
        <div className="heart w-full h-full scale-50 -translate-x-1/4 -translate-y-1/4"></div>
      </div>
      <div>
        <p className="font-cursive font-semibold text-primary-600">{name}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  </motion.div>
);

export default function Home() {
  const { scrollY } = useScroll();
  const y = useSpring(scrollY, { stiffness: 100, damping: 30 });
  const [showLoveMessage, setShowLoveMessage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for chime sound
    audioRef.current = new Audio('/sounds/chime.mp3');
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playChimeSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error('Audio playback failed', err));
    }
  };
  
  return (
    <div className="min-h-screen">
      <Header />
      <HeartBackground />
      <RosePetals />
      <LoveBirds />
      <HeartBalloons />
      <Butterflies />
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <motion.div 
          className="container mx-auto px-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="mb-8"
            animate={{ rotate: [0, 2, 0, -2, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.1, rotate: 5 }}
              onHoverStart={() => playChimeSound()}
            >
              <div className="heart mx-auto w-16 h-16 mb-4"></div>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="love-letter max-w-3xl mx-auto p-8 mb-8"
            whileHover={{ scale: 1.02 }}
          >
            <h1 className="text-5xl font-cursive mb-6 golden-ink">
              Transform Your Documents with AGAM
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Convert, merge, and process your documents with ease. No ads, no hassle, just pure document magic.
            </p>
            
            <motion.div 
              className="inline-block"
              onHoverStart={() => setShowLoveMessage(true)}
              onHoverEnd={() => setShowLoveMessage(false)}
            >
              <div className="relative">
                <Button 
                  onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                  size="lg"
                  variant="valentine"
                  className="px-10"
                  withSound
                >
                  Get Started with Love
                </Button>
                
                {showLoveMessage && (
                  <motion.div 
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-lg text-primary-500 whitespace-nowrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <span className="font-cursive">Made with love, no ads!</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaHeart className="text-primary-300 text-4xl" />
          </motion.div>
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-primary-50">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl font-cursive text-center mb-12 golden-ink"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Lovely Features
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={FaFilePdf}
              title="PDF Conversion"
              description="Convert any document to PDF format with perfect formatting and love for details"
            />
            <FeatureCard
              icon={FaFileWord}
              title="DOCX Export"
              description="Transform PDFs into editable Word documents with care and precision"
            />
            <FeatureCard
              icon={FaFilePowerpoint}
              title="Presentation Ready"
              description="Convert PDFs to PowerPoint presentations that will captivate your audience"
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-4xl font-cursive text-center mb-12 golden-ink"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What People Say
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              name="Sarah Johnson"
              role="Marketing Manager"
              content="AGAM has revolutionized how we handle document conversions. It's fast, reliable, and incredibly easy to use!"
            />
            <TestimonialCard
              name="David Chen"
              role="Software Developer"
              content="The API integration was seamless, and the conversion quality is outstanding. Exactly what we needed!"
            />
            <TestimonialCard
              name="Emily Brown"
              role="Freelance Designer"
              content="I love how AGAM maintains the design integrity of my documents. It's become an essential tool in my workflow."
            />
          </div>
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-cursive mb-6">Ready to Fall in Love?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of satisfied users who trust AGAM for their document conversion needs.</p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                size="lg"
                variant="outline"
                className="bg-white border-2 border-white text-primary-600 hover:bg-primary-50 hover:text-primary-800 font-bold px-10 shadow-lg"
                withSound
              >
                Try AGAM Now
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
} 