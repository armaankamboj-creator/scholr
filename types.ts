
export enum ClassLevel {
  Class8 = 'Class 8',
  Class9 = 'Class 9',
  Class10 = 'Class 10',
  Class11 = 'Class 11',
  Class12 = 'Class 12'
}

export enum Subject {
  Math = 'Mathematics',
  Science = 'Science',
  SocialScience = 'Social Science',
  English = 'English',
  Physics = 'Physics',
  Chemistry = 'Chemistry',
  Biology = 'Biology',
  Accountancy = 'Accountancy',
  Economics = 'Economics',
  BusinessStudies = 'Business Studies',
  ComputerScience = 'Computer Science'
}

export interface NoteSection {
  heading: string;
  contentPoints: string[]; 
  bulletPoints?: string[];
  importantTerms?: string[];
  imageDescription?: string; 
}

export interface SolvedQuestion {
  question: string;
  solution: string;
}

export interface StudyNote {
  topic: string;
  subject: string;
  classLevel: string;
  introduction: string;
  sections: NoteSection[];
  summary: string;
  examTips: string[];
  solvedQuestions: SolvedQuestion[];
  commonMistakes: string[];
  realWorldApplications: string[];
}

export interface ChapterCategory {
  category: string;
  chapters: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email' | 'anonymous';
}

export interface Bookmark {
  id: string;
  userId: string;
  type: 'topic' | 'section';
  title: string;
  subtitle: string;
  timestamp: number;
  noteData: StudyNote;
  sectionIndex?: number; // Only present if type is 'section'
}

export interface ViewState {
  currentView: 'landing' | 'class-select' | 'subject-select' | 'topic-select' | 'notes' | 'ai-tutor' | 'syllabus-analysis' | 'bookmarks';
  previousView?: 'landing' | 'class-select' | 'subject-select' | 'topic-select' | 'notes' | 'ai-tutor' | 'syllabus-analysis' | 'bookmarks';
  selectedClass?: ClassLevel;
  selectedSubject?: Subject;
  selectedTopic?: string;
  notesData?: StudyNote;
  availableChapters?: ChapterCategory[];
  isLoadingChapters?: boolean;
  tutorInitialQuery?: string;
  targetSectionIndex?: number; // For scrolling to specific section from bookmarks
}
