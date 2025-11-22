import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-pulse">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10" />
      </div>
      <h3 className="text-xl font-display text-white mb-2">Weaving your destiny...</h3>
      <p className="text-slate-400 max-w-md">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
