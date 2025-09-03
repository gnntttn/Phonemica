import { Language, GameFeedback, GameChallenge, PronunciationTip, ChatMessage, LearnScreenData } from '../types';

const PROXY_URL = '/.netlify/functions/gemini-proxy';

async function callProxy<T>(task: string, payload: object): Promise<T> {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task, payload })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'API call failed with status: ' + response.status }));
            console.error('API Error:', errorData);
            throw new Error(errorData.error || 'An unknown API error occurred.');
        }
        return await response.json();
    } catch (error) {
        console.error(`Error calling proxy for task "${task}":`, error);
        throw error;
    }
}

// Re-implement all functions to use the backend proxy
export const startScenarioChat = (language: Language, scenario: string): Promise<{ text: string }> => {
    return callProxy('startScenarioChat', { language, scenario });
}

export const generateChatResponse = (messages: ChatMessage[], language: Language, scenario?: string): Promise<{ text: string }> => {
    return callProxy('generateChatResponse', { messages, language, scenario });
};

export const generateSceneImage = async (scenario: string, language: Language): Promise<string | null> => {
    try {
        const result = await callProxy<{ imageUrl: string | null }>('generateSceneImage', { scenario, language });
        return result.imageUrl;
    } catch(e) {
        console.error("Failed to generate scene image via proxy:", e);
        return null;
    }
};

export const getLearnScreenData = (language: Language, reviewWordsCount: number): Promise<LearnScreenData> => {
    return callProxy('getLearnScreenData', { language, reviewWordsCount });
};

export const getMistakeExplanation = async (userMessage: string, aiMessage: string, language: Language): Promise<string> => {
    const result = await callProxy<{ text: string }>('getMistakeExplanation', { userMessage, aiMessage, language });
    return result.text;
};

export const getQuickTranslation = async (text: string, language: Language): Promise<string> => {
    const result = await callProxy<{ text: string }>('getQuickTranslation', { text, language });
    return result.text;
};

export const getFluencyFeedback = async (messages: ChatMessage[], language: Language): Promise<{ score: number; tip: string }> => {
    if(messages.filter(m => m.sender === 'user').length < 2) throw new Error("Not enough messages for feedback.");
    return callProxy('getFluencyFeedback', { messages, language });
};

export const getConversationSummary = async (messages: ChatMessage[], language: Language): Promise<string> => {
    if(messages.length < 3) return "The conversation was too short to summarize.";
    const result = await callProxy<{ text: string }>('getConversationSummary', { messages, language });
    return result.text;
};

export const getPronunciationTips = (text: string, language: Language): Promise<PronunciationTip[]> => {
    return callProxy('getPronunciationTips', { text, language });
};

export const startFirstChallenge = (language: Language, scenario: string): Promise<GameChallenge> => {
    return callProxy('startFirstChallenge', { language, scenario });
};

export const evaluateChallenge = (language: Language, challenge: string, userAnswer: string): Promise<GameFeedback> => {
    return callProxy('evaluateChallenge', { language, challenge, userAnswer });
};
