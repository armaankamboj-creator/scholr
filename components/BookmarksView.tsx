import React, { useEffect, useState } from 'react';
import { User, Bookmark, StudyNote } from '../types';
import { getBookmarks, removeBookmark } from '../services/userService';
import { Bookmark as BookmarkIcon, Trash2, ArrowRight, FileText, Hash, ArrowLeft } from 'lucide-react';

interface BookmarksViewProps {
  user: User;
  onOpenNote: (note: StudyNote, sectionIndex?: number) => void;
  onBack: () => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({ user, onOpenNote, onBack }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks(user.id));
  }, [user.id]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeBookmark(user.id, id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
       <button 
        onClick={onBack}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400 mb-8 transition-colors px-4 sm:px-0 bg-white/30 dark:bg-black/20 py-2 rounded-xl backdrop-blur-md border border-white/20 w-fit hover:scale-105 active:scale-95 duration-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back Home
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
          <BookmarkIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Library</h1>
          <p className="text-gray-500 dark:text-gray-400">Saved notes and important sections</p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <BookmarkIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No bookmarks yet</h3>
          <p className="text-gray-500 max-w-md mb-8">
            When you're studying, click the bookmark icon on any topic or section to save it here for quick access.
          </p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
          >
            Start Studying
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark, idx) => (
            <div 
              key={bookmark.id}
              onClick={() => onOpenNote(bookmark.noteData, bookmark.sectionIndex)}
              className="glass-card p-6 rounded-2xl group cursor-pointer hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${bookmark.type === 'topic' ? 'bg-brand-500' : 'bg-purple-500'}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  bookmark.type === 'topic' 
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' 
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                }`}>
                  {bookmark.type === 'topic' ? <FileText className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
                  {bookmark.type}
                </div>
                <button 
                  onClick={(e) => handleDelete(e, bookmark.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">
                {bookmark.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                {bookmark.subtitle}
              </p>

              <div className="flex items-center text-sm font-medium text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
                Read Note <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};