import React, { useState } from 'react';
import { X, Mail, Chrome, Loader2, ArrowRight, AlertTriangle, UserCircle, UserPlus, LogIn } from 'lucide-react';
import { User } from '../types';
import { loginUser, registerUser } from '../services/userService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [view, setView] = useState<'main' | 'login' | 'signup'>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSocialLogin = async (provider: 'google' | 'anonymous') => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginUser(provider);
      onLoginSuccess(user);
      onClose();
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      let user: User;
      if (view === 'signup') {
        user = await registerUser(email, password, name || 'Student');
      } else {
        user = await loginUser('email', email, password);
      }
      onLoginSuccess(user);
      onClose();
    } catch (e: any) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (e: any) => {
    console.error(e);
    let msg = "Authentication failed.";
    
    if (e.code === 'auth/popup-closed-by-user') msg = "Login cancelled.";
    else if (e.code === 'auth/email-already-in-use') msg = "This email is already registered.";
    else if (e.code === 'auth/invalid-credential') msg = "Invalid email or password.";
    else if (e.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
    else if (e.message?.includes("CONFIGURATION_ERROR")) {
      msg = "Setup Needed: Open services/userService.ts and add your Firebase Config.";
    }
    
    setError(msg);
  };

  const resetForm = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in-up"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden animate-pop-in border border-white/20">
        {/* Header Graphic */}
        <div className="h-32 bg-gradient-to-br from-brand-600 to-purple-600 relative overflow-hidden flex items-end p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white">
              {view === 'signup' ? 'Create Account' : view === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-brand-100 text-sm">
              {view === 'signup' ? 'Join Scholr to save your notes' : 'Sign in to sync your progress'}
            </p>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl flex items-start animate-pop-in">
              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {view === 'main' ? (
            <div className="space-y-4">
              <button 
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-[1.02] active:scale-[0.98] group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-red-500 group-hover:rotate-12 transition-transform" />}
                <span className="font-semibold text-gray-700 dark:text-gray-200">Continue with Google</span>
              </button>

              <button 
                onClick={() => { resetForm(); setView('login'); }}
                className="w-full flex items-center justify-center gap-3 p-4 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-all font-semibold"
              >
                <Mail className="w-5 h-5" />
                Continue with Email
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">No account required</span>
                </div>
              </div>

              <button 
                onClick={() => handleSocialLogin('anonymous')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold"
              >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCircle className="w-5 h-5" />}
                 Continue as Guest
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-slide-in-right">
              {view === 'signup' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                      placeholder="Your Name"
                    />
                 </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button 
                onClick={handleEmailAuth}
                disabled={loading || !email || !password || (view === 'signup' && !name)}
                className="w-full p-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand-500/30"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <>{view === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              <div className="flex justify-between items-center mt-6">
                <button 
                  onClick={() => { resetForm(); setView('main'); }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Back
                </button>
                
                <button 
                  onClick={() => { resetForm(); setView(view === 'login' ? 'signup' : 'login'); }}
                  className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  {view === 'login' ? (
                    <>New here? Create Account <UserPlus className="w-4 h-4" /></>
                  ) : (
                    <>Have an account? Login <LogIn className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
