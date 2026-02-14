import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, AlertCircle } from 'lucide-react';

const TRACKS = [
  {
    title: "Algorithms",
    artist: "Chad Crouch",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3"
  },
  {
    title: "Shipping Lanes",
    artist: "Chad Crouch",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Shipping_Lanes.mp3"
  },
  {
    title: "Platformer",
    artist: "Chad Crouch",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Platformer.mp3"
  },
  {
    title: "Starlight",
    artist: "Chad Crouch",
    url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Starlight.mp3"
  }
];

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to safely play audio and ignore interruption errors
  const playSafe = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setError(false);
    } catch (err: any) {
      // Ignore AbortError and 'interrupted' errors which happen during rapid switching
      // Also ignore Pause interruptions
      if (
        err.name !== 'AbortError' && 
        !err.message.includes('interrupted') &&
        !err.message.includes('pause')
      ) {
        console.warn("Audio playback failed:", err);
        // Only trigger error UI for actual failures (like 404s)
        if (err.name === 'NotSupportedError' || err.message.includes('source')) {
           setError(true);
           // Auto-skip to next track on error after a short delay
           setTimeout(() => handleNext(), 1500);
        }
      }
    }
  };

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous";
    audioRef.current.loop = false;
    audioRef.current.volume = 0.5;

    const handleEnded = () => {
      setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
    };

    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current = null;
      }
    };
  }, []);

  // Handle Track Changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const changeTrack = async () => {
      try {
        // Pause immediately and wait for next tick to avoid "interrupted" conflict
        audio.pause();
        // A slight delay ensures the pause promise settles before we load new src
        await new Promise(r => setTimeout(r, 0));
        
        audio.src = TRACKS[currentTrack].url;
        audio.load(); // Reset the media element
        
        if (isPlaying) {
          playSafe();
        }
      } catch (e) {
        console.warn("Track change interruption handled", e);
      }
    };

    changeTrack();
  }, [currentTrack]);

  // Handle Play/Pause Toggle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.src) playSafe();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % TRACKS.length);
  };

  const handlePrev = () => {
    setCurrentTrack((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fade-in-up">
      <div className={`glass-card p-3 rounded-2xl flex items-center gap-3 pr-5 bg-white/80 dark:bg-black/60 backdrop-blur-xl border ${error ? 'border-red-400' : 'border-white/20 dark:border-white/10'} shadow-2xl transition-all hover:scale-105`}>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}>
          {error ? <AlertCircle className="w-5 h-5 text-white" /> : <Music className="w-5 h-5 text-white" />}
        </div>
        
        <div className="flex flex-col w-32">
          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
            {error ? "Loading..." : TRACKS[currentTrack].title}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
             {error ? "Retrying..." : TRACKS[currentTrack].artist}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrev}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all shadow-md hover:shadow-brand-500/30 active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={handleNext}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};