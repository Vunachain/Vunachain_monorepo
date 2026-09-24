import React, { useEffect, useRef, useState } from 'react';
import Tooltip from './Tooltip';

const Hero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const [content, setContent] = useState<HeroContent | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    interface Line {
      y: number;
      baseY: number;
      phase: number;
      speed: number;
      frequency: number;
      amplitude: number;
    }

    let lines: Line[] = [];

    const lineCount = 20;
    const amplitudeBase = 40;
    const mouseRadius = 400;
    const mouseForce = 60;

    const init = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      lines = [];
      const step = (height + 200) / lineCount;
      for (let i = 0; i < lineCount; i++) {
        lines.push({
          y: i * step - 100,
          baseY: i * step - 100,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0005 + Math.random() * 0.001,
          frequency: 0.001 + Math.random() * 0.002,
          amplitude: amplitudeBase + Math.random() * 20,
        });
      }
    };

    const updateMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains('dark');
      const strokeColor = isDark ? 'rgba(97, 184, 105, 0.1)' : 'rgba(97, 184, 105, 0.15)';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      const xStep = 15;

      lines.forEach(line => {
        ctx.beginPath();
        let started = false;
        for (let x = -50; x <= width + 50; x += xStep) {
          const waveOffset = Math.sin(x * line.frequency + time * line.speed + line.phase);
          const waveOffset2 = Math.sin(x * line.frequency * 2.5 + time * line.speed * 1.5 + line.phase);
          let y = line.baseY + (waveOffset + waveOffset2 * 0.5) * line.amplitude;

          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius) {
            const force = (1 - dist / mouseRadius);
            const ease = force * force * (3 - 2 * force);
            const directionY = dy > 0 ? 1 : -1;
            y += directionY * ease * mouseForce;
          }
          if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <article className="flex flex-col gap-6 text-left">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="material-symbols-outlined text-base" aria-hidden="true">verified</span>
              EUDR Compliant &middot; Celo Blockchain &middot; Kenya Tea Act 2020
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              {content?.headline ||
                'Ship to Europe with Proof, Not Promises.'}
            </h1>

            <p className="max-w-xl text-lg text-gray-600 dark:text-gray-300">
              {content?.subheadline ||
                'Every harvest, every input credit, every compliance report — immutably recorded on-chain. Vunachain gives cooperatives and exporters the traceability infrastructure to clear EUDR inspections, recover input finance, and pay farmers instantly via M-Pesa.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#roi" className="flex h-12 items-center justify-center rounded-lg bg-red-600 px-8 text-base font-bold text-white shadow-xl shadow-red-600/20 hover:bg-red-700 hover:shadow-2xl hover:shadow-red-600/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ease-out transform">
                {content?.primaryButtonText || 'Calculate Your ROI'}
              </a>
              <a href="#how-it-works" className="flex h-12 items-center justify-center rounded-lg border border-gray-200 dark:border-white/20 bg-transparent px-8 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/30 hover:shadow-sm active:scale-95 transition-all duration-200 transform">
                {content?.secondaryButtonText || 'See How It Works'}
              </a>
            </div>

            {/* Audience signals */}
            <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Tooltip content="For cooperatives">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">person</span>
                </Tooltip>
                For cooperatives &amp; aggregators
              </span>
              <span className="text-gray-300 dark:text-gray-600">&middot;</span>
              <span className="flex items-center gap-1.5">
                <Tooltip content="For exporters and buyers">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">store</span>
                </Tooltip>
                For exporters &amp; buyers
              </span>
              <span className="text-gray-300 dark:text-gray-600">&middot;</span>
              <span className="flex items-center gap-1.5">
                <Tooltip content="M-Pesa settlements">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">payments</span>
                </Tooltip>
                M-Pesa settlements
              </span>
            </div>
          </article>

          {/* Map */}
          <figure className="relative lg:ml-auto w-full max-w-lg lg:max-w-none group">
            <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-neutral-900 shadow-2xl transition-transform duration-700 hover:scale-[1.01]">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm border border-gray-100 dark:border-white/10 shadow-sm z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tooltip content="Verified Badge">
                      <span className="material-symbols-outlined text-primary" aria-hidden="true">verified</span>
                    </Tooltip>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Batch #{'KE-2024-899'}</span>
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
              <div
                className="absolute -inset-4 -z-10 bg-primary/20 blur-3xl opacity-30 rounded-full transition-opacity duration-700 group-hover:opacity-50"
                aria-hidden="true"
              ></div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default Hero;
