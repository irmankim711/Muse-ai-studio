import React, { useState } from 'react';
import { StoryGenre } from '../types';
import { Sword, Rocket, Ghost, Search, Map, Cpu, ArrowRight } from 'lucide-react';

interface SetupScreenProps {
  onStart: (genre: StoryGenre, character: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre>(StoryGenre.FANTASY);
  const [characterName, setCharacterName] = useState('');

  const genres = [
    { type: StoryGenre.FANTASY, icon: <Sword className="w-6 h-6" />, desc: "Magic, dragons, and epic quests." },
    { type: StoryGenre.SCI_FI, icon: <Rocket className="w-6 h-6" />, desc: "Space, aliens, and advanced tech." },
    { type: StoryGenre.MYSTERY, icon: <Search className="w-6 h-6" />, desc: "Puzzles, detectives, and secrets." },
    { type: StoryGenre.HORROR, icon: <Ghost className="w-6 h-6" />, desc: "Fear, suspense, and the supernatural." },
    { type: StoryGenre.ADVENTURE, icon: <Map className="w-6 h-6" />, desc: "Exploration, danger, and discovery." },
    { type: StoryGenre.CYBERPUNK, icon: <Cpu className="w-6 h-6" />, desc: "Neon lights, hackers, and dystopia." },
  ];

  const handleStart = () => {
    if (characterName.trim()) {
      onStart(selectedGenre, characterName);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full fade-in">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-display font-bold text-white mb-4">Begin Your Chronicle</h2>
        <p className="text-slate-400 text-lg">Choose a genre and name your hero to let the AI craft your unique visual adventure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {genres.map((g) => (
          <button
            key={g.type}
            onClick={() => setSelectedGenre(g.type)}
            className={`p-6 rounded-xl border transition-all duration-300 flex flex-col items-center text-center gap-3
              ${selectedGenre === g.type 
                ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
              }`}
          >
            <div className={`p-3 rounded-full ${selectedGenre === g.type ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {g.icon}
            </div>
            <h3 className="text-lg font-bold text-white">{g.type}</h3>
            <p className="text-sm text-slate-400">{g.desc}</p>
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-2">Protagonist Name</label>
        <input
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="e.g. Elara, Kael, Dr. Vance..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
        <button
          onClick={handleStart}
          disabled={!characterName.trim()}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
        >
          Start Adventure <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
