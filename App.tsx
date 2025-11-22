import React, { useState, useEffect } from 'react';
import { StoryState, StoryGenre, StorySegment } from './types';
import { generateStorySegment, generateSceneImage } from './services/gemini';
import Header from './components/Header';
import SetupScreen from './components/SetupScreen';
import StoryBoard from './components/StoryBoard';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [state, setState] = useState<StoryState>({
    genre: null,
    mainCharacter: '',
    segments: [],
    isGenerating: false,
    error: null
  });

  const [initLoading, setInitLoading] = useState(false);

  // Handle starting the story
  const handleStartStory = async (genre: StoryGenre, character: string) => {
    setInitLoading(true);
    setState(prev => ({ ...prev, isGenerating: true, genre, mainCharacter: character }));

    try {
      // 1. Generate Text
      const response = await generateStorySegment(genre, character, [], null);
      
      // 2. Generate Image
      // We do this in parallel with rendering if we wanted, but simpler to wait for both 
      // to avoid layout shifts in the first load, or show a skeleton. 
      // Let's show text first then load image to be faster? 
      // For this prototype, we'll wait for the image to ensure maximum "Wow" factor on reveal.
      
      const imageUrl = await generateSceneImage(response.imageDescription);

      const newSegment: StorySegment = {
        id: Date.now().toString(),
        text: response.storyText,
        imagePrompt: response.imageDescription,
        imageUrl: imageUrl,
        choices: response.choices
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        segments: [newSegment]
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: "Failed to awaken the muse. Please try again."
      }));
      console.error(err);
    } finally {
      setInitLoading(false);
    }
  };

  // Handle making a choice
  const handleChoice = async (choice: string) => {
    setState(prev => ({ ...prev, isGenerating: true }));

    // Construct context from previous segments (last 2 for relevance + summary if we had one)
    const context = state.segments.map(s => s.text);

    try {
      const response = await generateStorySegment(
        state.genre!, 
        state.mainCharacter, 
        context, 
        choice
      );

      // Create segment immediately with no image so text is readable
      const tempId = Date.now().toString();
      const newSegmentWithoutImage: StorySegment = {
        id: tempId,
        text: response.storyText,
        imagePrompt: response.imageDescription,
        choices: response.choices
      };

      // Optimistic update
      setState(prev => ({
        ...prev,
        segments: [...prev.segments, newSegmentWithoutImage]
      }));

      // Fetch image in background then update
      const imageUrl = await generateSceneImage(response.imageDescription);
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        segments: prev.segments.map(seg => 
          seg.id === tempId ? { ...seg, imageUrl } : seg
        )
      }));

    } catch (err) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: "The story thread snapped. Please try again."
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <Header />
      
      <main className="flex flex-col items-center justify-start min-h-[calc(100vh-64px)] relative">
        {/* Background Ambient Effects */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]"></div>
        </div>

        {state.error && (
           <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3">
              <span>{state.error}</span>
              <button onClick={() => setState(s => ({...s, error: null}))} className="underline text-sm">Dismiss</button>
           </div>
        )}

        {/* Main Content Switcher */}
        <div className="relative z-10 w-full">
          {state.segments.length === 0 ? (
            initLoading ? (
               <div className="h-[80vh] flex items-center justify-center">
                 <LoadingOverlay message={`Summoning a ${state.genre} world for ${state.mainCharacter}...`} />
               </div>
            ) : (
              <SetupScreen onStart={handleStartStory} />
            )
          ) : (
            <StoryBoard 
              segments={state.segments} 
              onChoice={handleChoice}
              isGenerating={state.isGenerating}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
