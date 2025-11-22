import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2 text-indigo-400">
        <BookOpen className="w-6 h-6" />
        <span className="text-xl font-display font-bold tracking-wider text-white">MUSE</span>
      </div>
      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <span>Powered by Gemini 2.5</span>
      </div>
    </header>
  );
};

export default Header;
