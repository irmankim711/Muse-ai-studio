export enum StoryGenre {
  FANTASY = 'Fantasy',
  SCI_FI = 'Sci-Fi',
  MYSTERY = 'Mystery',
  HORROR = 'Horror',
  ADVENTURE = 'Adventure',
  CYBERPUNK = 'Cyberpunk'
}

export interface StorySegment {
  id: string;
  text: string;
  imagePrompt: string;
  imageUrl?: string; // Base64 string
  choices: string[];
}

export interface StoryState {
  genre: StoryGenre | null;
  mainCharacter: string;
  segments: StorySegment[];
  isGenerating: boolean;
  error: string | null;
}

export interface GenerateStoryResponse {
  storyText: string;
  imageDescription: string;
  choices: string[];
}
