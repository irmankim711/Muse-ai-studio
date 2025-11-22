import React, { useRef, useEffect, useState } from 'react';
import { StorySegment } from '../types';
import { RefreshCw, ChevronRight, Download, Share2, ImagePlus, Check, RotateCcw, Undo2 } from 'lucide-react';

interface StoryBoardProps {
  segments: StorySegment[];
  onChoice: (choice: string) => void;
  onShare: () => void;
  onRegenerateImage: (segmentId: string) => void;
  onReset: () => void;
  onUndo: () => void;
  isGenerating: boolean;
}

const StoryBoard: React.FC<StoryBoardProps> = ({ 
  segments, 
  onChoice, 
  onShare,
  onRegenerateImage, 
  onReset,
  onUndo,
  isGenerating 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  const currentSegment = segments[segments.length - 1];

  const handleDownload = () => {
    const textContent = segments.map((seg, i) => `Scene ${i + 1}:\n${seg.text}\n`).join('\n---\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muse-story.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareClick = () => {
    onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
         <div className="flex items-center gap-2">
             <button 
                onClick={onUndo}
                disabled={isGenerating}
                className="text-xs flex items-center gap-2 text-slate-300 hover:text-white transition-colors px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Undo2 className="w-4 h-4" /> Back
             </button>
         </div>

         <div className="flex items-center gap-2">
             <button 
                onClick={onReset}
                disabled={isGenerating}
                className="text-xs flex items-center gap-2 text-slate-400 hover:text-red-300 transition-colors px-3 py-1.5 hover:bg-slate-800 border border-transparent hover:border-red-900/30 rounded-lg"
             >
               <RotateCcw className="w-4 h-4" /> Restart
             </button>
             <div className="h-4 w-px bg-slate-700 mx-1"></div>
             <button 
                onClick={handleShareClick}
                className="text-xs flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-900/20 hover:bg-indigo-900/40 px-3 py-1.5 rounded-lg border border-indigo-500/30"
             >
               {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} 
               {copied ? "Link Copied!" : "Share Story"}
             </button>
             <button 
                onClick={handleDownload}
                className="text-xs flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-3 py-1.5"
             >
               <Download className="w-4 h-4" /> Save Text
             </button>
         </div>
      </div>

      <div className="flex-grow space-y-12 pb-32">
        {segments.map((segment, index) => (
          <div key={segment.id} className={`fade-in flex flex-col lg:flex-row gap-8 items-start ${index !== segments.length - 1 ? 'opacity-90' : ''}`}>
            <div className="flex-1 order-2 lg:order-1 bg-slate-900/40 p-6 md:p-8 rounded-2xl border border-slate-800/60 shadow-lg">
              <span className="text-indigo-500 text-xs font-bold tracking-widest uppercase mb-3 block">
                Chapter {index + 1}
              </span>
              <div className="prose prose-invert prose-lg text-slate-200 font-serif leading-relaxed whitespace-pre-wrap">
                {segment.text}
              </div>
            </div>

            <div className="w-full lg:w-1/2 order-1 lg:order-2">
               <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 aspect-video bg-slate-800 group border border-slate-700/50">
                  {segment.imageUrl ? (
                    <img 
                      src={segment.imageUrl} 
                      alt="Scene illustration" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 p-6 text-center bg-slate-800/80">
                      {isGenerating && index === segments.length - 1 ? (
                        <>
                           <RefreshCw className="w-8 h-8 animate-spin text-indigo-500/50" />
                           <span className="text-sm animate-pulse">Dreaming up visuals...</span>
                        </>
                      ) : (
                        <>
                           <ImagePlus className="w-8 h-8 text-slate-600 mb-1" />
                           <p className="text-sm text-slate-400 mb-2">Visuals not loaded</p>
                           <button 
                             onClick={() => onRegenerateImage(segment.id)}
                             disabled={isGenerating}
                             className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-full transition-all disabled:opacity-50"
                           >
                             Generate Scene Art
                           </button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {segment.imageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <p className="text-xs text-white/70 line-clamp-2 italic">{segment.imagePrompt}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-12 pb-8 z-40 px-4 pointer-events-none">
         <div className="max-w-4xl mx-auto pointer-events-auto">
            {!isGenerating ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 {currentSegment.choices.map((choice, idx) => (
                   <button
                     key={idx}
                     onClick={() => onChoice(choice)}
                     className="group relative overflow-hidden bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500 text-left p-4 rounded-xl transition-all active:scale-95 shadow-lg backdrop-blur-sm"
                   >
                     <span className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-1.5 transition-all"></span>
                     <div className="flex items-center justify-between pl-3">
                       <span className="text-sm md:text-base text-indigo-100 font-medium">{choice}</span>
                       <ChevronRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                     </div>
                   </button>
                 ))}
               </div>
            ) : (
               <div className="flex justify-center items-center gap-3 py-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                  <span className="text-slate-300 font-display animate-pulse">Conjurating the next chapter...</span>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default StoryBoard;