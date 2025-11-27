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

  // --- Serialization Logic for Sharing ---
  
  const serializeState = (currentState: StoryState) => {
    const minifiedData = {
      g: currentState.genre,
      c: currentState.mainCharacter,
      s: currentState.segments.map(s => ({
        id: s.id,
        text: s.text,
        imagePrompt: s.imagePrompt,
        choices: s.choices
        // imageUrl is excluded to keep URL size manageable
      }))
    };
    const jsonString = JSON.stringify(minifiedData);
    // Handle Unicode characters (emojis, etc.) for Base64
    return btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
    ));
  };

  const deserializeState = (hash: string): Partial<StoryState> | null => {
    try {
      const base64 = hash.substring(1);
      // Decode Unicode characters from Base64
      const jsonString = decodeURIComponent(atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const data = JSON.parse(jsonString);
      
      if (!data.g || !data.c || !Array.isArray(data.s)) return null;

      return {
        genre: data.g,
        mainCharacter: data.c,
        segments: data.s, // Segments loaded without imageUrl
        isGenerating: false,
        error: null
      };
    } catch (e) {
      console.error("Failed to parse story from URL:", e);
      return null;
    }
  };

  // Helper to safely clear URL hash without triggering security errors in blob/iframe contexts
  const clearUrlHash = () => {
    try {
      // replaceState is safer than pushState in sandboxes.
      // Use pathname + search to cleanly remove hash without side effects
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (e) {
      // Fallback: simple hash clear
      window.location.hash = '';
    }
  };

  // Check for shared story on mount
  useEffect(() => {
    if (window.location.hash.length > 1) {
      const sharedState = deserializeState(window.location.hash);
      if (sharedState) {
        setState(prev => ({ ...prev, ...sharedState as StoryState }));
      }
    }
  }, []);

  // --- Handlers ---

  const handleStartStory = async (genre: StoryGenre, character: string) => {
    // Clear any existing hash when starting new
    clearUrlHash();
    
    setInitLoading(true);
    setState(prev => ({ ...prev, isGenerating: true, genre, mainCharacter: character, segments: [] }));

    try {
      const response = await generateStorySegment(genre, character, [], null);
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

  const handleReset = () => {
    // Clear state and URL hash to allow starting a new story
    setInitLoading(false);
    setState({
      genre: null,
      mainCharacter: '',
      segments: [],
      isGenerating: false,
      error: null
    });
    clearUrlHash();
  };

  const handleUndo = () => {
    if (state.isGenerating) return;
    
    // Clearing hash to avoid confusion with URL state when modifying story
    clearUrlHash();

    setState(prev => {
        const newSegments = prev.segments.slice(0, -1);
        return {
            ...prev,
            segments: newSegments,
            isGenerating: false,
            error: null
        };
    });
  };

  const handleChoice = async (choice: string) => {
    setState(prev => ({ ...prev, isGenerating: true }));

    const context = state.segments.map(s => s.text);

    try {
      const response = await generateStorySegment(
        state.genre!, 
        state.mainCharacter, 
        context, 
        choice
      );

      const tempId = Date.now().toString();
      const newSegmentWithoutImage: StorySegment = {
        id: tempId,
        text: response.storyText,
        imagePrompt: response.imageDescription,
        choices: response.choices
      };

      setState(prev => ({
        ...prev,
        segments: [...prev.segments, newSegmentWithoutImage]
      }));

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

  const handleShare = () => {
    const hash = serializeState(state);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url);
  };

  const handleRegenerateImage = async (segmentId: string) => {
    const segment = state.segments.find(s => s.id === segmentId);
    if (!segment) return;

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const imageUrl = await generateSceneImage(segment.imagePrompt);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        segments: prev.segments.map(s => 
          s.id === segmentId ? { ...s, imageUrl } : s
        )
      }));
    } catch (e) {
      console.error("Failed to regenerate image", e);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: "Failed to visualize this scene." 
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

        <div className="relative z-10 w-full">
          {state.segments.length === 0 ? (
            initLoading ? (
               <div className="h-[80vh] flex items-center justify-center">
                 <LoadingOverlay message={`Summoning a ${state.genre || 'mysterious'} world for ${state.mainCharacter || 'a hero'}...`} />
               </div>
            ) : (
              <SetupScreen 
                onStart={handleStartStory} 
                initialGenre={state.genre}
                initialCharacter={state.mainCharacter}
              />
            )
          ) : (
            <StoryBoard 
              segments={state.segments} 
              onChoice={handleChoice}
              onShare={handleShare}
              onRegenerateImage={handleRegenerateImage}
              isGenerating={state.isGenerating}
              onReset={handleReset}
              onUndo={handleUndo}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;