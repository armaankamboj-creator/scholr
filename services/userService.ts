import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, Bookmark, StudyNote } from '../types';

// =========================================================================
// SUPABASE CONFIGURATION
// =========================================================================
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_HERE';

// Check if config has been updated by the user
export const isFirebaseConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL_HERE';

let supabase: SupabaseClient | null = null;

if (isFirebaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Supabase initialization failed:", error);
  }
}

const STORAGE_KEY_BOOKMARKS = 'scholr_bookmarks';
const STORAGE_KEY_GUEST = 'scholr_guest_session';

// Helper: Map Supabase User to App User
const mapUser = (sbUser: SupabaseUser, provider: User['provider']): User => {
  const metadata = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    name: metadata.full_name || metadata.name || 'Student',
    email: sbUser.email || '',
    avatar: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
    provider
  };
};

// Login Service
export const loginUser = async (providerName: User['provider'], email?: string, password?: string): Promise<User> => {
  // Handle Guest Mode Locally (No Supabase Needed)
  if (providerName === 'anonymous') {
    const guestUser: User = {
      id: 'guest-' + Date.now().toString().slice(-6),
      name: 'Guest Student',
      email: '',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest`,
      provider: 'anonymous'
    };
    localStorage.setItem(STORAGE_KEY_GUEST, JSON.stringify(guestUser));
    return guestUser;
  }

  // Enforce Configuration for Real Auth
  if (!isFirebaseConfigured || !supabase) {
    throw new Error("CONFIGURATION_ERROR: Please open 'services/userService.ts' and paste your Supabase URL and Key.");
  }

  try {
    let result;
    if (providerName === 'google') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // Note: OAuth redirect means this might not return immediately in the same session flow
      // But typically we rely on the subscription listener on redirect
      if (!data.url) throw new Error("OAuth failed to initialize");
      
      // For single page apps with redirect, we rarely get here. 
      // But for type safety, we return a pending state or throw to handle in UI
      return { id: 'pending', name: 'Redirecting...', email: '', provider: 'google' }; 
    } 
    
    if (providerName === 'email') {
      if (!email || !password) throw new Error("Email and password required");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user returned");
      return mapUser(data.user, 'email');
    }

    throw new Error(`Provider ${providerName} not supported`);
  } catch (error: any) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Registration Service (for Email/Password)
export const registerUser = async (email: string, password: string, name: string): Promise<User> => {
  if (!isFirebaseConfigured || !supabase) {
    throw new Error("CONFIGURATION_ERROR");
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error("Registration succeeded but no user returned");
    
    return mapUser(data.user, 'email');
  } catch (error: any) {
    console.error("Registration failed:", error);
    throw error;
  }
}

export const logoutUser = async () => {
  // Clear guest session
  localStorage.removeItem(STORAGE_KEY_GUEST);
  
  if (supabase) {
    await supabase.auth.signOut();
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  // 1. Check for Guest Session first
  const guestSession = localStorage.getItem(STORAGE_KEY_GUEST);
  if (guestSession) {
    try {
      callback(JSON.parse(guestSession));
    } catch {
      localStorage.removeItem(STORAGE_KEY_GUEST);
    }
  }

  if (!supabase) {
    if (!guestSession) callback(null);
    return () => {};
  }

  // 2. Subscribe to Supabase Auth
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // If guest session is active, ignore Supabase (unless specific logic dictates otherwise)
    if (localStorage.getItem(STORAGE_KEY_GUEST)) return;

    if (session?.user) {
      // Determine provider best guess
      const provider = session.user.app_metadata.provider === 'email' ? 'email' : 'google';
      callback(mapUser(session.user, provider));
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

// Bookmark Logic (Kept Local for Simplicity & Speed)
export const getBookmarks = (userId: string): Bookmark[] => {
  const allBookmarks = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKMARKS) || '{}');
  return allBookmarks[userId] || [];
};

export const addBookmark = (userId: string, noteData: StudyNote, type: 'topic' | 'section', sectionIndex?: number): Bookmark => {
  const allBookmarks = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKMARKS) || '{}');
  const userBookmarks: Bookmark[] = allBookmarks[userId] || [];

  const newBookmark: Bookmark = {
    id: `bm_${Date.now()}`,
    userId,
    type,
    title: type === 'topic' ? noteData.topic : noteData.sections[sectionIndex!].heading,
    subtitle: type === 'topic' ? `${noteData.classLevel} • ${noteData.subject}` : `From: ${noteData.topic}`,
    timestamp: Date.now(),
    noteData,
    sectionIndex
  };

  const exists = userBookmarks.some(b => 
    b.type === type && 
    b.noteData.topic === noteData.topic && 
    b.sectionIndex === sectionIndex
  );

  if (!exists) {
    userBookmarks.unshift(newBookmark);
    allBookmarks[userId] = userBookmarks;
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(allBookmarks));
  }
  
  return newBookmark;
};

export const removeBookmark = (userId: string, bookmarkId: string) => {
  const allBookmarks = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKMARKS) || '{}');
  if (allBookmarks[userId]) {
    allBookmarks[userId] = allBookmarks[userId].filter((b: Bookmark) => b.id !== bookmarkId);
    localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(allBookmarks));
  }
};

export const isBookmarked = (userId: string, topic: string, sectionIndex?: number): boolean => {
  const bookmarks = getBookmarks(userId);
  return bookmarks.some(b => 
    b.noteData.topic === topic && 
    b.sectionIndex === sectionIndex
  );
};

export const getCurrentUser = (): User | null => {
  return null; 
};