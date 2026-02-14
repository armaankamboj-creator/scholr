import React, { useState, useRef } from 'react';
import { Upload, FileText, ArrowLeft, Loader2, Award, Zap, AlertTriangle, RefreshCcw } from 'lucide-react';
import { analyzeSyllabus } from '../services/geminiService';
import { marked } from 'marked';

interface SyllabusAnalysisProps {
  onBack: () => void;
}

export const SyllabusAnalysis: React.FC<SyllabusAnalysisProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      setFile(file);
      setAnalysis(null);
      setErrorMsg(null);
    } else {
      alert("Please upload a PDF or an Image file.");
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const base64 = await convertToBase64(file);
      const result = await analyzeSyllabus(base64, file.type);
      setAnalysis(result);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to analyze syllabus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getHtmlAnalysis = (text: string) => {
    try {
      return marked.parse(text);
    } catch (e) {
      return text;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in-up">
      <button 
        onClick={onBack}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400 mb-8 transition-colors px-4 sm:px-0 bg-white/30 dark:bg-black/20 py-2 rounded-xl backdrop-blur-md border border-white/20 w-fit hover:scale-105 active:scale-95 duration-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back Home
      </button>

      {!analysis ? (
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-6 shadow-inner">
            <Upload className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Upload Your Syllabus
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
            Upload your syllabus PDF or image. Our AI will analyze high-weightage topics and create a strategic plan to help you score 100/100.
          </p>

          <div 
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-300 ${
              dragActive 
                ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 scale-[1.02]" 
                : "border-gray-300 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50/50 dark:hover:bg-white/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".pdf,image/*" 
              onChange={handleChange}
            />
            
            {file ? (
              <div className="flex flex-col items-center animate-pop-in">
                <FileText className="w-12 h-12 text-brand-600 dark:text-brand-400 mb-4" />
                <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">{file.name}</p>
                <p className="text-sm text-gray-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                
                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start text-left w-full max-w-md">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 dark:text-red-300 mb-2">{errorMsg}</p>
                          <button 
                             onClick={handleAnalyze}
                             className="text-xs font-bold text-red-600 dark:text-red-400 underline hover:no-underline flex items-center"
                          >
                            <RefreshCcw className="w-3 h-3 mr-1" /> Retry Analysis
                          </button>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => { setFile(null); setErrorMsg(null); }}
                    className="px-6 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 font-medium transition-colors"
                  >
                    Remove
                  </button>
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-8 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-500/30 flex items-center transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                    {loading ? "Analyzing..." : "Analyze Now"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="text-lg font-bold text-brand-600 dark:text-brand-400 hover:underline mb-2"
                 >
                   Click to upload
                 </button>
                 <p className="text-gray-500 dark:text-gray-400">or drag and drop file here</p>
                 <p className="text-xs text-gray-400 mt-4">Supports: PDF, PNG, JPG</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in-up">
           <div className="glass-card rounded-3xl p-8 sm:p-12 mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 dark:bg-green-500/20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
             <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl">
                 <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
               </div>
               <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Success Roadmap</h2>
             </div>
             
             <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-200 syllabus-content">
               {/* Use marked to render the HTML */}
               <div dangerouslySetInnerHTML={{ __html: getHtmlAnalysis(analysis) }} />
             </div>
           </div>
           
           <div className="text-center">
              <button 
                onClick={() => { setFile(null); setAnalysis(null); }}
                className="px-6 py-3 bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 backdrop-blur-md rounded-xl font-medium text-gray-700 dark:text-gray-200 border border-white/20 transition-all"
              >
                Upload Another Document
              </button>
           </div>
        </div>
      )}
    </div>
  );
};