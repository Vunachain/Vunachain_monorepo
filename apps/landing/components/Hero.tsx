import React, { useEffect, useRef, useState } from 'react';
import Tooltip from './Tooltip';
import { getLandingPageData } from '../lib/sanity';

const Hero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [content, setContent] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Defer map loading to prioritize LCP
    const timer = setTimeout(() => setShowMap(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getLandingPageData();
        if (data && data.hero) setContent(data.hero);
      } catch (error) {
        console.error('Error fetching hero content:', error);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    // ... (rest of the animation code remains the same)
    // I will only change the JSX part below.
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Line interface
    interface Line {
      y: number;
      baseY: number;
      phase: number;
      speed: number;
      frequency: number;
      amplitude: number;
    }

    let lines: Line[] = [];

    // Configuration
    const lineCount = 20; // Number of contour lines
    const amplitudeBase = 40;
    const mouseRadius = 400;
    const mouseForce = 60;

    const init = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;

      lines = [];
      // Draw lines vertically spaced
      const step = (height + 200) / lineCount; // Add buffer

      for (let i = 0; i < lineCount; i++) {
        lines.push({
          y: i * step - 100, // Start slightly above
          baseY: i * step - 100,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0005 + Math.random() * 0.001,
          frequency: 0.001 + Math.random() * 0.002,
          amplitude: amplitudeBase + Math.random() * 20
        });
      }
    };

    const updateMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Determine color based on theme - checking html class
      const isDark = document.documentElement.classList.contains('dark');
      // Subtle primary green with gradient feel
      const strokeColor = isDark ? 'rgba(97, 184, 105, 0.1)' : 'rgba(97, 184, 105, 0.15)';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;

      // Optimization: Calculate points with a step
      const xStep = 15;

      lines.forEach(line => {
        ctx.beginPath();
        let started = false;

        // Draw across width
        for (let x = -50; x <= width + 50; x += xStep) {
          // Base Sine Wave Calculation
          // Using time to animate phase
          const waveOffset = Math.sin(x * line.frequency + time * line.speed + line.phase);
          // Combine with a second wave for more irregularity (Perlin-ish feel)
          const waveOffset2 = Math.sin(x * line.frequency * 2.5 + time * line.speed * 1.5 + line.phase);

          let y = line.baseY + (waveOffset + waveOffset2 * 0.5) * line.amplitude;

          // Mouse Interaction: Repel/Bulge effect
          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius) {
            const force = (1 - dist / mouseRadius);
            // Smooth cubic ease out
            const ease = force * force * (3 - 2 * force);

            // Push lines away vertically primarily, but with some radial influence
            // This creates a "hill" under the mouse
            const directionY = dy > 0 ? 1 : -1;
            y += directionY * ease * mouseForce;
          }

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            // Bezier curve could be smoother but straight lines with small steps are efficient
            // Let's use quadratic curves for extra smoothness if needed, 
            // but lineTo with small steps is visually indistinguishable for this effect.
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    window.addEventListener('resize', init);
    window.addEventListener('mousemove', updateMouse);
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', updateMouse);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-32 transition-colors duration-300">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">

          {/* Left Content */}
          <article className="flex flex-col gap-6 text-left">
            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              {content?.headline || "Turn Global Compliance Into Your Strongest Asset."}
            </h1>

            <p className="max-w-xl text-lg text-gray-600 dark:text-gray-300">
              {content?.subheadline || "Stop viewing regulations as a roadblock. Vunachain transforms complex compliance into a competitive edge, allowing you to access premium markets while paying your farmers instantly. Fully compliant with Kenya's Tea Act 2020 and global EUDR standards."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#roi" className="flex h-12 items-center justify-center rounded-lg bg-red-600 px-8 text-base font-bold text-white shadow-xl shadow-red-600/20 hover:bg-red-700 hover:shadow-2xl hover:shadow-red-600/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out transform">
                {content?.primaryButtonText || "Estimate my ROI"}
              </a>
              <a href="#technology" className="flex h-12 items-center justify-center rounded-lg border border-gray-200 dark:border-white/20 bg-transparent px-8 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30 hover:shadow-sm active:scale-95 transition-all duration-200 transform">
                {content?.secondaryButtonText || "See the Compliance Tech"}
              </a>
            </div>
          </article>

          {/* Right Map Interface (Optimized: No iframe/services) */}
          <figure className="relative lg:ml-auto w-full max-w-lg lg:max-w-none group">
            <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-neutral-900 shadow-2xl transition-transform duration-700 hover:scale-[1.01]">

              {/* Map Background - Nyeri Satellite View */}
              {showMap ? (
                <iframe
                  title="Satellite map of Nyeri, Kenya showing Vunachain verification area"
                  className="absolute inset-0 h-full w-full border-0 opacity-90 grayscale-[10%] contrast-[1.1] transition-opacity duration-700 animate-in fade-in"
                  src="https://maps.google.com/maps?ll=-0.4167,36.9500&t=h&z=14&ie=UTF8&output=embed"
                  loading="lazy"
                  allowFullScreen
                  style={{ pointerEvents: 'none' }}
                ></iframe>
              ) : (
                <div className="absolute inset-0 bg-neutral-900/50 animate-pulse" aria-hidden="true" />
              )}

              {/* Graduate Template Overlay (Restored with Map) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" aria-hidden="true" />


              {/* Card Overlay */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm border border-gray-100 dark:border-white/10 shadow-sm z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tooltip content="Verified Badge">
                      <span className="material-symbols-outlined text-primary" aria-hidden="true">verified</span>
                    </Tooltip>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Batch #KE-2024-899</span>
                  </div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">VERIFIED</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Origin</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Nyeri, KE</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Crop</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Arabica Coffee</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Deforestation</p>
                    <p className="font-semibold text-primary">0% Risk</p>
                  </div>
                </div>
              </div>

              {/* Pulsing Markers */}
              <Tooltip content="Farm Location #1" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div
                  className="h-4 w-4 rounded-full bg-primary shadow-[0_0_0_4px_rgba(97,184,105,0.3)] animate-pulse"
                  aria-label="Verified farm location 1"
                ></div>
              </Tooltip>
              <Tooltip content="Farm Location #2" className="absolute top-1/3 right-1/4 z-10">
                <div
                  className="h-3 w-3 rounded-full bg-primary shadow-[0_0_0_4px_rgba(97,184,105,0.3)] animate-pulse delay-300"
                  aria-label="Verified farm location 2"
                ></div>
              </Tooltip>
            </div>

            {/* Background Glow */}
            <div
              className="absolute -inset-4 -z-10 bg-primary/20 blur-3xl opacity-30 rounded-full transition-opacity duration-700 group-hover:opacity-50"
              aria-hidden="true"
            ></div>
          </figure>

        </div>
      </div>
    </section>
  );
};

export default Hero;