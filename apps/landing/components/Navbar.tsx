import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Tooltip from './Tooltip';
import { isProduction } from '../utils/api';

interface NavbarProps {
  onOpenDemo: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenDemo }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  const navLinks = [
    { name: 'Insights', href: '/blog' },
    { name: 'Challenges', href: '/#challenges' },
    { name: 'Technology', href: '/#technology' },
    { name: 'ROI', href: '/#roi' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);

      // Calculate scroll progress
      const winHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (winHeight > 0) {
        const progress = currentScrollY / winHeight;
        setScrollProgress(Math.min(1, Math.max(0, progress)));
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${scrolled || isMenuOpen ? 'border-gray-200 dark:border-white/10 bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur-md shadow-sm' : 'border-transparent bg-transparent'}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo Section */}
        <Link
          to="/"
          className="flex items-center cursor-pointer select-none group active:scale-95 transition-transform duration-200"
          onClick={() => {
            if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Tooltip content="Vunachain Home">
            <img
              src="/logo.png"
              alt="Vunachain - EUDR Compliance & Supply Chain Traceability"
              className="h-10 w-auto brightness-110 contrast-125 dark:brightness-0 dark:invert transition-all duration-300 group-hover:scale-105"
            />
          </Tooltip>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map((item) => (
            item.href.startsWith('/#') ? (
              <a
                key={item.name}
                href={item.href}
                className="group relative text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200 hover:text-primary dark:hover:text-white"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full"></span>
              </a>
            ) : (
              <Link
                key={item.name}
                to={item.href}
                className="group relative text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors duration-200 hover:text-primary dark:hover:text-white"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full"></span>
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Theme Toggle (Desktop) */}
          <Tooltip content={isDarkMode ? "Switch to light mode" : "Switch to dark mode"} className="hidden md:flex">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 hover:rotate-12 active:scale-90 active:rotate-0"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </Tooltip>

          {!isProduction && (
            <a href="/login" className="hidden md:flex h-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/20 bg-transparent px-4 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/30 active:bg-gray-200 dark:active:bg-white/10 active:scale-95 transition-all duration-200">
              Login
            </a>
          )}
          <button
            onClick={onOpenDemo}
            className="hidden md:flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
          >
            Book a Demo
          </button>

          {/* Mobile Menu Toggle */}
          <Tooltip content={isMenuOpen ? "Close Menu" : "Open Menu"} className="md:hidden flex">
            <button
              className="h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 active:scale-90 transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <div
        className="absolute bottom-0 left-0 h-[3px] bg-primary z-50 transition-all duration-100 ease-out"
        style={{ width: `${scrollProgress * 100}%` }}
        aria-hidden="true"
      />

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav
          className="md:hidden absolute top-20 left-0 w-full z-[45] border-t border-gray-200 dark:border-white/10 bg-surface-light dark:bg-background-dark animate-in slide-in-from-top-5 fade-in duration-300 shadow-2xl"
          aria-label="Mobile navigation"
        >
          <div className="space-y-1 px-4 py-8 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {navLinks.map((item) => (
              item.href.startsWith('/#') ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white active:scale-[0.98] transition-all duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-primary dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white active:scale-[0.98] transition-all duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            ))}

            {/* Theme Toggle (Mobile) */}
            <div className="flex items-center justify-between px-4 py-3 mt-2">
              <span className="text-base font-medium text-gray-600 dark:text-gray-300">Appearance</span>
              <Tooltip content={isDarkMode ? "Light Mode" : "Dark Mode"}>
                <button
                  onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 active:scale-90 transition-all duration-200"
                  aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <span className="material-symbols-outlined">
                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
              </Tooltip>
            </div>

            <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
              {!isProduction && (
                <a href="/login" className="flex h-12 w-full items-center justify-center rounded-lg border border-gray-200 dark:border-white/20 bg-transparent px-4 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition-all duration-200">
                  Login
                </a>
              )}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenDemo();
                }}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 text-base font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 transition-all duration-200"
              >
                Book a Demo
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;