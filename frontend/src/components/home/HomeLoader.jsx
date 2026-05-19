import React, { useEffect, useState, useRef } from 'react';
import LottieImport from 'lottie-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import homeAnimation from '../../assets/home-loader.json';

const Lottie = LottieImport.default || LottieImport;

export default function HomeLoader({ show = false, onFinish, durationMs = 3200 }) {
  const { isDark } = useTheme();
  const [progress, setProgress] = useState(0);

  // Ensure the animation has required layers/assets arrays to prevent lottie-react crashes
  const safeAnimationData = React.useMemo(() => {
    if (!homeAnimation) return null;
    return {
      ...homeAnimation,
      layers: homeAnimation.layers || [],
      assets: homeAnimation.assets || []
    };
  }, []);

  // Stabilize the onFinish callback reference to insulate loader from parent re-renders
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Extract variables from the home-loader.json theme config or fall back to defaults
  const themeColors = isDark ? homeAnimation.theme?.dark : homeAnimation.theme?.light;
  const bgColor = isDark 
    ? 'linear-gradient(135deg, #150A08 0%, #2A120F 100%)' 
    : 'linear-gradient(135deg, #FFF4F2 0%, #FDF4F2 100%)';
  const primaryColor = themeColors?.primary || (isDark ? '#FDF4F2' : '#3D1F1A');
  const accentColor = themeColors?.accent || (isDark ? '#E6C34A' : '#D4A017');
  const secondaryColor = themeColors?.secondary || (isDark ? '#E5D1CD' : '#7A4A44');

  // Prevent scrolling when the loader is active
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  // Handle auto-progress and trigger onFinish safely without re-rendering resets
  useEffect(() => {
    if (!show) return;

    setProgress(0);
    const intervalTime = 30; // Milliseconds between steps
    const totalSteps = durationMs / intervalTime;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min((currentStep / totalSteps) * 100, 100);
      setProgress(Math.floor(currentProgress));

      if (currentStep >= totalSteps) {
        clearInterval(progressInterval);
        setTimeout(() => {
          onFinishRef.current?.();
        }, 150); // Small delay to let the user see 100%
      }
    }, intervalTime);

    return () => {
      clearInterval(progressInterval);
    };
  }, [show, durationMs]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="home-loader-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center px-6"
          style={{ 
            background: bgColor,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999999,
            overflow: 'hidden'
          }}
        >
          {/* Stunning Background Sparkles & Ambient Glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Elegant Golden Radial Light Source */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.55, 0.4]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px]"
              style={{
                background: isDark
                  ? `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`
                  : `radial-gradient(circle, ${accentColor}0C 0%, transparent 70%)`
              }}
            />

            {/* Molten Chocolate Bottom Ambient Glow */}
            <div 
              className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[160px] opacity-30"
              style={{
                background: isDark ? '#3D1F1A' : '#7A4A44'
              }}
            />

            {/* Sparkles Floating Around */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth - window.innerWidth / 2,
                  y: Math.random() * window.innerHeight - window.innerHeight / 2,
                  scale: Math.random() * 0.4 + 0.2,
                  opacity: Math.random() * 0.3 + 0.1
                }}
                animate={{
                  y: ['0px', '-40px', '0px'],
                  opacity: [0.2, 0.6, 0.2]
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: accentColor,
                  boxShadow: `0 0 10px ${accentColor}`
                }}
              />
            ))}
          </div>

          {/* Core Animation Card */}
          <div className="relative flex flex-col items-center max-w-[340px] w-full z-10">
            
            {/* Golden Elegant Loading Ring Container */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 mb-8 flex items-center justify-center">
              
              {/* Pulsing Outer Aura */}
              <motion.div
                animate={{
                  scale: [0.95, 1.05, 0.95],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full border border-dashed"
                style={{ borderColor: `${accentColor}33` }}
              />

              {/* Rotating Molten Gold Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute w-[90%] h-[90%] rounded-full border-2"
                style={{ 
                  borderColor: 'transparent',
                  borderTopColor: accentColor,
                  borderRightColor: `${accentColor}22`,
                  borderBottomColor: `${accentColor}44`,
                  filter: `drop-shadow(0 0 8px ${accentColor}44)`
                }}
              />

              {/* Inverse Rotating Soft Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-[80%] h-[80%] rounded-full border"
                style={{ 
                  borderColor: 'transparent',
                  borderBottomColor: secondaryColor,
                  borderLeftColor: `${secondaryColor}22`,
                  opacity: 0.6
                }}
              />

              {/* Central Premium Cacao Pod & Lottie Player */}
              <div className="absolute inset-4 rounded-full flex items-center justify-center overflow-hidden bg-transparent">
                {/* Lottie Animation (loads configuration) */}
                <div className="absolute inset-0 w-full h-full max-w-[140px] flex items-center justify-center opacity-30">
                  {safeAnimationData && (
                    <Lottie
                      animationData={safeAnimationData}
                      loop={true}
                      autoplay={true}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  )}
                </div>

                {/* Shimmering Golden Cacao pod Royal Emblem (Luxury Visual Centerpiece) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <motion.div 
                    animate={{
                      scale: [0.95, 1.05, 0.95],
                      boxShadow: [
                        `0 10px 30px ${isDark ? 'rgba(230,195,74,0.1)' : 'rgba(212,160,23,0.1)'}`,
                        `0 10px 40px ${isDark ? 'rgba(230,195,74,0.25)' : 'rgba(212,160,23,0.25)'}`,
                        `0 10px 30px ${isDark ? 'rgba(230,195,74,0.1)' : 'rgba(212,160,23,0.1)'}`
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${isDark ? '#2A120F' : '#FDE8E4'} 0%, ${isDark ? '#150A08' : '#FAF8F5'} 100%)`,
                      border: `2px solid ${accentColor}44`,
                    }}
                  >
                    <svg viewBox="0 0 64 64" className="w-14 h-14" style={{ color: accentColor }}>
                      <defs>
                        <filter id="gold-glow" x="-10%" y="-10%" width="120%" height="120%">
                          <feGaussianBlur stdDeviation="2.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      
                      <g filter="url(#gold-glow)">
                        {/* Elegant Cacao bean contour */}
                        <path 
                          d="M32,10 C20,20 14,32 14,44 C14,54 20,57 32,57 C44,57 50,54 50,44 C50,32 44,20 32,10 Z" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5" 
                          strokeLinecap="round"
                        />
                        <path 
                          d="M32,10 C27,22 28,42 32,57" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeDasharray="3 3"
                        />
                        {/* Shimmering Center Cacao Star */}
                        <path 
                          d="M32,25 L34.5,30 L39.5,30.5 L35.5,34 L36.8,39 L32,36.5 L27.2,39 L28.5,34 L24.5,30.5 L29.5,30 Z" 
                          fill="currentColor"
                        />
                      </g>
                    </svg>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Brand Logo and Title */}
            <div className="text-center mb-8">
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-xl sm:text-2xl font-black uppercase tracking-[0.35em] mb-3 leading-none"
                style={{ color: primaryColor }}
              >
                The Chocolate Mine
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.45em]"
                style={{ color: accentColor }}
              >
                Artisanal Desserts & Chocolates
              </motion.p>
            </div>

            {/* Premium Progress Bar and Percentage Indicator */}
            <div className="w-full px-4 flex flex-col items-center">
              {/* Progress Line */}
              <div 
                className="w-full h-[3px] rounded-full overflow-hidden relative mb-3"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
              >
                <motion.div
                  className="h-full rounded-full absolute left-0 top-0"
                  style={{
                    background: `linear-gradient(90deg, ${secondaryColor} 0%, ${accentColor} 100%)`,
                    width: `${progress}%`,
                    boxShadow: `0 0 10px ${accentColor}88`
                  }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>

              {/* Progress Text */}
              <motion.div 
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: primaryColor, opacity: 0.5 }}
              >
                <span>Loading Experience</span>
                <span style={{ color: accentColor }}>{progress}%</span>
              </motion.div>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
