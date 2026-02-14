import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, ArrowLeft } from 'lucide-react';
import { getTutorChat } from '../services/geminiService';
import { GenerateContentResponse, Chat } from "@google/genai";
import { ChatMessage } from '../types';

interface AITutorProps {
  initialQuery?: string;
  onBack: () => void;
}

export const AITutor: React.FC<AITutorProps> = ({ initialQuery, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = getTutorChat();
    }

    if (initialQuery && !hasInitialized.current) {
      hasInitialized.current = true;
      setInput(initialQuery);
      setMessages([{role: 'model', text: `I see you selected some text: "${initialQuery.substring(0, 50)}...". How can I help you with this?`}]);
    } else if (!hasInitialized.current) {
      hasInitialized.current = true;
      setMessages([{role: 'model', text: "Hello! I'm your AI Tutor. I can help you with any topic from Class 8 to 12. What are you studying today?"}]);
    }
  }, [initialQuery]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !chatSessionRef.current) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: textToSend });
      
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]); 

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponse += c.text;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].text = fullResponse;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto rounded-3xl overflow-hidden glass-card shadow-2xl animate-scale-in">
      {/* Header */}
      <div className="bg-white/60 dark:bg-black/60 backdrop-blur-md p-4 flex items-center justify-between border-b border-white/20 dark:border-white/10">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-700 dark:text-gray-200 hover:scale-110 active:scale-95 duration-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-gradient-to-tr from-brand-500 to-purple-600 rounded-xl shadow-lg animate-pop-in">
                <Bot className="w-6 h-6 text-white" />
             </div>
             <div>
               <h2 className="font-bold text-lg text-gray-900 dark:text-white">AI Tutor</h2>
               <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Always here to help</p>
             </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-transparent scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-right`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`p-4 rounded-2xl shadow-md whitespace-pre-wrap leading-relaxed backdrop-blur-md border transform transition-all hover:scale-[1.01] ${
                msg.role === 'user' 
                  ? 'bg-brand-600/90 text-white rounded-tr-none border-brand-500' 
                  : 'bg-white/70 dark:bg-black/40 text-gray-800 dark:text-gray-200 border-white/40 dark:border-white/10 rounded-tl-none font-medium'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
             <div className="flex max-w-[80%] gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                   <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white/70 dark:bg-black/40 p-4 rounded-2xl rounded-tl-none border border-white/40 dark:border-white/10 backdrop-blur-md">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/40 dark:bg-black/40 border-t border-white/20 dark:border-white/10 backdrop-blur-md">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }} 
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white backdrop-blur-sm placeholder-gray-500 dark:placeholder-gray-400 transition-shadow focus:shadow-lg"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 ease-spring"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};