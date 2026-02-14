import React from 'react';
import { ClassLevel } from '../types';
import { ChevronRight, GraduationCap } from 'lucide-react';

interface ClassCardProps {
  classLevel: ClassLevel;
  onClick: (c: ClassLevel) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ classLevel, onClick }) => {
  return (
    <button
      onClick={() => onClick(classLevel)}
      className="group relative flex flex-col items-center justify-center p-8 rounded-3xl 
        glass-card
        hover:scale-[1.03] active:scale-[0.98]
        hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_20px_40px_rgba(59,130,246,0.2)]
        hover:border-brand-200/50 dark:hover:border-brand-700/50
        transition-all duration-300 ease-spring
      "
    >
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-[-10px]">
        <ChevronRight className="w-5 h-5 text-brand-500" />
      </div>
      
      <div className="w-16 h-16 mb-4 rounded-2xl bg-brand-50/80 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 shadow-inner group-hover:scale-110 transition-transform duration-300 ease-spring">
        <GraduationCap className="w-8 h-8" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {classLevel}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-medium">
        Complete NCERT Notes & Exam Prep
      </p>
    </button>
  );
};