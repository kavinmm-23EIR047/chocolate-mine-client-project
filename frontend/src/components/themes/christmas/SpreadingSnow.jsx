import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Full-viewport spreading snow + warm gold twinkling stars canvas,
 * paired with optional frost icicle corner accents.
 * Strictly pointer-events-none so storefront interactions remain 100% unobstructed.
 */
const SpreadingSnow = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const isMobile = width < 768;
    const flakeCount = prefersReducedMotion ? 22 : isMobile ? 55 : 115;
    const starCount = prefersReducedMotion ? 8 : isMobile ? 16 : 28;

    const flakes = Array.from({ length: flakeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.4 + Math.random() * 3.8,
      speedY: 0.45 + Math.random() * 1.45,
      spreadAmp: 0.35 + Math.random() * 1.15,
      spreadPhase: Math.random() * Math.PI * 2,
      spreadFreq: 0.008 + Math.random() * 0.018,
      opacity: 0.35 + Math.random() * 0.55,
      softGlow: Math.random() > 0.65,
    }));

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.85,
      size: 2.5 + Math.random() * 4.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.025 + Math.random() * 0.035,
    }));

    let rafId = null;
    let tick = 0;

    const render = () => {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      // Subtle warm golden festive stars
      for (const s of stars) {
        s.phase += s.speed;
        const alpha = 0.22 + 0.55 * (0.5 + 0.5 * Math.sin(s.phase));
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.fillStyle = isDark
          ? `rgba(253, 224, 71, ${alpha})`
          : `rgba(217, 119, 6, ${alpha * 0.7})`;
        ctx.beginPath();
        const r = s.size;
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
        ctx.restore();
      }

      // Spreading snow flakes
      for (const f of flakes) {
        if (!prefersReducedMotion) {
          f.spreadPhase += f.spreadFreq;
          f.y += f.speedY;
          // Outward / gentle breeze spreading across viewport
          f.x += Math.sin(f.spreadPhase) * f.spreadAmp + 0.22;

          if (f.y > height + 10) {
            f.y = -10;
            f.x = Math.random() * width;
          }
          if (f.x > width + 12) f.x = -12;
          if (f.x < -12) f.x = width + 12;
        }

        ctx.beginPath();
        if (f.softGlow) {
          const radius = f.r * 2.2;
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
          grad.addColorStop(
            0,
            isDark ? `rgba(255,255,255,${f.opacity})` : `rgba(219,234,254,${Math.min(0.95, f.opacity + 0.15)})`
          );
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grad;
          ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${f.opacity})`
            : `rgba(186, 230, 253, ${Math.min(0.92, f.opacity + 0.15)})`;
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-[120]"
    />
  );
};

export default SpreadingSnow;
