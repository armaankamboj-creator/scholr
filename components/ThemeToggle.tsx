import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-white/50 dark:bg-black/30 hover:bg-white/80 dark:hover:bg-black/50 transition-all border border-white/20 dark:border-white/10 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? <Sun className="w-5 h-5 text-yellow-400 drop-shadow-sm" /> : <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
    </button>
  );
};