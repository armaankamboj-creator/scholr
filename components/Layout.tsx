import React from 'react';
import { BookOpen, User as UserIcon, LogOut, Bookmark, LogIn, AlertCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { MusicPlayer } from './MusicPlayer';
import { APP_NAME, TRADEMARK_TEXT } from '../constants';
import { User } from '../types';
import { isFirebaseConfigured } from '../services/userService';

interface LayoutProps {
  children: React.ReactNode;
  onHomeClick: () => void;
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onBookmarksClick: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onHomeClick, 
  user, 
  onLoginClick, 
  onLogoutClick,
  onBookmarksClick
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Configuration Warning Banner */}
      {!isFirebaseConfigured && (
        <div className="bg-amber-500 text-white px-4 py-2 text-sm font-medium text-center shadow-md animate-fade-in-up flex items-center justify-center gap-2 z-[60] relative">
          <AlertCircle className="w-4 h-4" />
          <span>
            Setup Required: Login is currently disabled. Open <code>services/userService.ts</code> and paste your Firebase Project Config.
          </span>
        </div>
      )}

      {/* Liquid Glass Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/60 dark:bg-black/40 border-b border-white/20 dark:border-white/10 shadow-sm supports-[backdrop-filter]:bg-white/60 animate-fade-in-up" style={{animationDuration: '0.8s'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-200 group"
            onClick={onHomeClick}
          >
            <div className="bg-brand-600/90 p-1.5 rounded-xl shadow-lg shadow-brand-500/30 group-hover:rotate-12 transition-transform duration-300 ease-spring">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">
              {APP_NAME}
            </span>
          </div>

          <nav className="flex items-center gap-3 sm:gap-4">
             <span className="hidden md:inline-block text-xs font-semibold px-3 py-1 bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full border border-green-200/50 dark:border-green-800/50 backdrop-blur-md animate-pop-in" style={{animationDelay: '0.2s'}}>
                NCERT Certified
             </span>
            
            <ThemeToggle />

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full bg-white/50 dark:bg-white/10 border border-white/20 hover:bg-white/80 transition-all"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block truncate max-w-[100px]">
                    {user.name}
                  </span>
                  <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-brand-100" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 animate-scale-in origin-top-right">
                       <button 
                         onClick={() => {
                           setShowUserMenu(false);
                           onBookmarksClick();
                         }}
                         className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                       >
                         <Bookmark className="w-4 h-4" /> Library
                       </button>
                       <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                       <button 
                         onClick={() => {
                           setShowUserMenu(false);
                           onLogoutClick();
                         }}
                         className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                       >
                         <LogOut className="w-4 h-4" /> Sign Out
                       </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className={`flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/20 active:scale-95 ${!isFirebaseConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isFirebaseConfigured}
                title={!isFirebaseConfigured ? "Setup Firebase in userService.ts first" : "Login"}
              >
                <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
      </main>

      <MusicPlayer />

      {/* Liquid Glass Footer */}
      <footer className="w-full py-8 border-t border-white/20 dark:border-white/10 mt-auto bg-white/30 dark:bg-black/30 backdrop-blur-lg transition-colors animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
            Made with ❤️ by Students, for Students.
          </p>
          <p className="text-gray-400 dark:text-gray-600 text-xs font-light">
            {TRADEMARK_TEXT}
          </p>
        </div>
      </footer>
    </div>
  );
};