export enum Language {
  French = 'French',
  Arabic = 'Arabic',
}

export enum Sender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
}

export interface FluencyFeedback {
  score: number;
  tip: string;
}

export interface GameFeedback {
  evaluation: string;
  correction?: string;
  score: number; // e.g., 1, 2, or 3 stars
  nextChallenge?: string; // For multi-turn conversations
}

export interface GameChallenge {
    challenge: string;
    scenario: string;
}

export interface WordOfDay {
    word: string;
    translation: string;
    example: string;
}

export interface IdiomOfDay {
    idiom: string;
    meaning: string;
    literalTranslation: string;
    example: string;
}

export interface PronunciationTip {
    word: string;
    tip: string;
}

export interface ReviewWord {
    id: string;
    word: string;
    translation: string;
    level: number;
    reviewDate: string; // ISO string
}

export interface User {
    name: string;
    dailyXP: number;
    dailyGoal: number;
}

export interface DailyPlanStep {
    title: string;
    description: string;
    action: 'review' | 'chat' | 'game';
}

export interface LearnScreenData {
    dailyPlan: DailyPlanStep[];
    wordOfDay: WordOfDay;
    idiomOfDay: IdiomOfDay;
}
