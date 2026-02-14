import React, { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ClassCard } from './components/ClassCard';
import { NotesDisplay } from './components/NotesDisplay';
import { AITutor } from './components/AITutor';
import { SyllabusAnalysis } from './components/SyllabusAnalysis';
import { AuthModal } from './components/AuthModal';
import { BookmarksView } from './components/BookmarksView';
import { generateNotes, getChapters } from './services/geminiService';
import { logoutUser, subscribeToAuthChanges } from './services/userService';
import { ClassLevel, Subject, ViewState, StudyNote, User } from './types';
import { SUBJECTS_BY_CLASS } from './constants';
import { Search, Loader2, Sparkles, Book, ArrowLeft, ChevronRight, BookOpen, Bot, GraduationCap, FileText } from 'lucide-react';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>({
    currentView: 'landing'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState('');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setViewState({ currentView: 'landing' });
  };

  const resetHome = useCallback(() => {
    setViewState({ currentView: 'landing', previousView: undefined });
    setError(null);
    setTopicInput('');
  }, []);

  const handleStartClassSelection = () => {
    setViewState({ currentView: 'class-select', previousView: 'landing' });
  };

  const handleStartAITutor = () => {
    setViewState({ currentView: 'ai-tutor', previousView: 'landing' });
  };
  
  const handleStartSyllabus = () => {
    setViewState({ currentView: 'syllabus-analysis', previousView: 'landing' });
  };

  const handleClassSelect = (classLevel: ClassLevel) => {
    setViewState(prev => ({
      ...prev,
      currentView: 'subject-select',
      previousView: 'class-select',
      selectedClass: classLevel
    }));
  };

  const handleSubjectSelect = async (subject: Subject) => {
    const currentClass = viewState.selectedClass;
    if (!currentClass) return;

    setViewState(prev => ({
      ...prev,
      currentView: 'topic-select',
      previousView: 'subject-select',
      selectedSubject: subject,
      isLoadingChapters: true,
      availableChapters: []
    }));

    try {
      const categories = await getChapters(currentClass, subject);
      setViewState(prev => ({
        ...prev,
        availableChapters: categories,
        isLoadingChapters: false
      }));
    } catch (e) {
      console.error(e);
      setViewState(prev => ({
        ...prev,
        isLoadingChapters: false,
        error: "Could not load chapters automatically. Please type your topic below."
      }));
    }
  };

  const generateNotesForTopic = async (topic: string) => {
    if (!viewState.selectedClass || !viewState.selectedSubject) return;

    setLoading(true);
    setError(null);

    try {
      const notes = await generateNotes(
        viewState.selectedClass,
        viewState.selectedSubject,
        topic
      );
      setViewState(prev => ({
        ...prev,
        currentView: 'notes',
        previousView: 'topic-select',
        notesData: notes,
        selectedTopic: topic,
        targetSectionIndex: undefined
      }));
    } catch (err) {
      setError("Failed to generate notes. Please try a different topic or check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBookmark = (note: StudyNote, sectionIndex?: number) => {
    setViewState({
      currentView: 'notes',
      previousView: 'bookmarks',
      notesData: note,
      selectedClass: note.classLevel as ClassLevel,
      selectedSubject: note.subject as Subject,
      selectedTopic: note.topic,
      targetSectionIndex: sectionIndex
    });
  };

  // Loading Overlay Component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in-up">
      <div className="relative">
        <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
        <Loader2 className="w-16 h-16 text-brand-600 dark:text-brand-400 animate-spin relative z-10" />
      </div>
      <h2 className="mt-8 text-2xl font-bold text-gray-900 dark:text-white animate-pulse">
        Generating Study Notes...
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">
        Creating comprehensive NCERT content for you
      </p>
    </div>
  );

  const renderContent = () => {
    switch (viewState.currentView) {
      case 'landing':
        return (
          <div key="landing" className="animate-fade-in-up flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div className="mb-8 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse"></div>
              <div className="relative bg-white dark:bg-black rounded-full p-4 ring-1 ring-gray-900/5 shadow-xl">
                 <BookOpen className="w-16 h-16 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400">CBSE Exams</span>
            </h1>
            
            <p className="max-w-2xl text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed font-medium">
              Premium, NCERT-certified notes generated instantly by AI. 
              Designed by top students to help you score 100/100.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
              <button 
                onClick={handleStartClassSelection}
                className="group relative px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-500/30 transition-all hover:scale-105 active:scale-95 ease-spring w-full sm:w-auto"
              >
                <div className="flex items-center justify-center">
                  Start Learning
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
              
              <button 
                onClick={handleStartAITutor}
                className="group relative px-8 py-4 bg-white/50 dark:bg-white/10 text-gray-900 dark:text-white rounded-2xl font-bold text-lg backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-white/20 transition-all hover:scale-105 active:scale-95 ease-spring w-full sm:w-auto"
              >
                <div className="flex items-center justify-center">
                  <Bot className="w-5 h-5 mr-2" />
                  Ask AI Tutor
                </div>
              </button>

              <button 
                onClick={handleStartSyllabus}
                className="group relative px-8 py-4 bg-purple-600/90 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 ease-spring w-full sm:w-auto"
              >
                 <div className="flex items-center justify-center">
                   <FileText className="w-5 h-5 mr-2" />
                   Upload Syllabus
                 </div>
              </button>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-left">
              {[
                { icon: Book, title: "NCERT Aligned", desc: "Strictly follows CBSE 2026 syllabus." },
                { icon: Sparkles, title: "AI Powered", desc: "Instant, detailed, and accurate notes." },
                { icon: GraduationCap, title: "Exam Focused", desc: "Includes solved questions & exam tips." }
              ].map((item, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform duration-300 ease-spring">
                  <item.icon className="w-8 h-8 text-brand-500 mb-4" />
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'class-select':
        return (
          <div key="class-select" className="animate-fade-in-up">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Select Your Class</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(ClassLevel).map((level, idx) => (
                <div key={level} style={{ animationDelay: `${idx * 100}ms` }} className="animate-fade-in-up">
                  <ClassCard classLevel={level} onClick={handleClassSelect} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'subject-select':
        return (
          <div key="subject-select" className="animate-fade-in-up">
            <button onClick={() => setViewState(prev => ({...prev, currentView: 'class-select'}))} className="mb-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors hover:scale-105 active:scale-95 origin-left">
              <ArrowLeft className="w-5 h-5 mr-2" /> Change Class
            </button>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Subjects for <span className="text-brand-600 dark:text-brand-400">{viewState.selectedClass}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewState.selectedClass && SUBJECTS_BY_CLASS[viewState.selectedClass].map((subject, idx) => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className="glass-card p-6 rounded-2xl text-left hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 ease-spring group animate-fade-in-up"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {subject}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Click to view chapters</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'topic-select':
        return (
          <div key="topic-select" className="animate-fade-in-up max-w-3xl mx-auto">
            <button onClick={() => setViewState(prev => ({...prev, currentView: 'subject-select'}))} className="mb-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors hover:scale-105 active:scale-95 origin-left">
              <ArrowLeft className="w-5 h-5 mr-2" /> Change Subject
            </button>
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                What do you want to study?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {viewState.selectedClass} • {viewState.selectedSubject}
              </p>
            </div>

            {/* Custom Topic Input */}
            <div className="glass-card p-6 rounded-3xl mb-10">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Search or Type Topic
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g., Photosynthesis, Calculus Integration..."
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:outline-none dark:text-white transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && topicInput && generateNotesForTopic(topicInput)}
                />
                <button
                  onClick={() => topicInput && generateNotesForTopic(topicInput)}
                  disabled={loading || !topicInput}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* AI Generated Chapter List */}
            {viewState.isLoadingChapters ? (
              <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                 <p className="text-gray-500 animate-pulse font-medium">Loading syllabus...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {viewState.availableChapters?.map((cat, idx) => (
                  <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-2 border-l-4 border-brand-500">
                      {cat.category}
                    </h3>
                    <div className="grid gap-3">
                      {cat.chapters.map((chapter, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => generateNotesForTopic(chapter)}
                          className="w-full text-left p-4 glass-card rounded-xl hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex justify-between items-center group"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                            {chapter}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 -translate-x-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {error && (
               <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center font-medium animate-pop-in border border-red-100 dark:border-red-800">
                 {error}
               </div>
            )}
          </div>
        );

      case 'notes':
        return viewState.notesData ? (
          <div key="notes" className="animate-fade-in-up">
            <NotesDisplay 
              data={viewState.notesData} 
              user={user}
              scrollToSectionIndex={viewState.targetSectionIndex}
              onBack={() => setViewState(prev => ({
                ...prev, 
                currentView: prev.previousView === 'bookmarks' ? 'bookmarks' : 'topic-select'
              }))}
              onAskTutor={(text) => {
                 setViewState(prev => ({
                   ...prev,
                   currentView: 'ai-tutor',
                   previousView: 'notes',
                   tutorInitialQuery: text
                 }));
              }}
              onLoginRequest={() => setAuthModalOpen(true)}
            />
          </div>
        ) : null;

      case 'ai-tutor':
        return (
          <div key="ai-tutor" className="animate-pop-in">
            <AITutor 
              initialQuery={viewState.tutorInitialQuery}
              onBack={() => setViewState(prev => ({
                ...prev, 
                currentView: prev.previousView || 'landing',
                tutorInitialQuery: undefined
              }))}
            />
          </div>
        );
      
      case 'syllabus-analysis':
        return (
          <div key="syllabus-analysis" className="animate-pop-in">
             <SyllabusAnalysis onBack={() => setViewState(prev => ({ ...prev, currentView: 'landing' }))} />
          </div>
        );

      case 'bookmarks':
        return user ? (
          <div key="bookmarks" className="animate-pop-in">
            <BookmarksView 
              user={user} 
              onOpenNote={handleOpenBookmark}
              onBack={() => setViewState({ currentView: 'landing' })}
            />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Layout 
      onHomeClick={resetHome}
      user={user}
      onLoginClick={() => setAuthModalOpen(true)}
      onLogoutClick={handleLogout}
      onBookmarksClick={() => setViewState({ currentView: 'bookmarks', previousView: viewState.currentView })}
    >
      {loading && <LoadingOverlay />}
      {renderContent()}
      
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />
    </Layout>
  );
}