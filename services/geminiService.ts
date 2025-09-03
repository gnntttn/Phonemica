import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Language, GameFeedback, GameChallenge, PronunciationTip, ChatMessage, DailyPlanStep, LearnScreenData, WordOfDay, IdiomOfDay } from '../types';
import { getSystemInstruction, getGameSystemInstruction } from '../constants';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const createTutorChat = (language: Language, scenario?: string): Chat => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: getSystemInstruction(language, scenario),
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
        },
    });
    return chat;
};

export const generateSceneImage = async (scenario: string, language: Language): Promise<string | null> => {
    try {
        const langName = language === Language.French ? "French" : "Arabic";
        const prompt = `A beautiful, photorealistic, wide-angle image from the first-person perspective of someone in a ${langName} setting, based on the theme: "${scenario}". The scene should be immersive and set the context for a language learning conversation. The image should be vibrant and inviting. Do not include any text or people in the image.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Failed to generate scene image:", error);
        return null; // Return null on error so the UI can handle it gracefully.
    }
};

export const getLearnScreenData = async (language: Language, reviewWordsCount: number): Promise<LearnScreenData> => {
    const langName = language === Language.French ? "French" : "Arabic";
    const prompt = `Generate all the data needed for the main "Learn" screen of a language learning app for a student learning ${langName}. The student has ${reviewWordsCount} words to review today.

I need a single JSON object with three top-level keys: "dailyPlan", "wordOfDay", and "idiomOfDay".

1.  **dailyPlan**: A 3-step learning plan. Each step is an object with "title", "description", and "action" keys. The action must be one of 'review', 'chat', or 'game'. If the student has words to review (${reviewWordsCount} > 0), the first step's action MUST be 'review'. Otherwise, start with 'chat'.

2.  **wordOfDay**: An object for a common, useful word (A2-B1 level). It must have "word", "translation" (in English), and "example" sentence keys.

3.  **idiomOfDay**: An object for a common idiom. It must have "idiom", "literalTranslation", "meaning", and "example" sentence keys.`;

    const fallbackData: LearnScreenData = {
        dailyPlan: [
            { title: "Conversation Practice", description: "Free chat or practice scenarios.", action: 'chat' },
            { title: "Speak Coach", description: "Complete role-playing challenges.", action: 'game' },
            { title: "Review Flashcards", description: "Review your saved words.", action: 'review' }
        ],
        wordOfDay: {
            word: language === Language.French ? "Bonjour" : "مرحبا",
            translation: "Hello",
            example: language === Language.French ? "Bonjour, comment ça va ?" : "مرحبا كيف حالك؟"
        },
        idiomOfDay: {
            idiom: language === Language.French ? "Coûter un bras" : "يكلف ذراعا",
            literalTranslation: "To cost an arm",
            meaning: "To be very expensive",
            example: language === Language.French ? "Ce téléphone coûte un bras !" : "هذا الهاتف يكلف ذراعا!"
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dailyPlan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    action: { type: Type.STRING }
                                },
                                required: ["title", "description", "action"]
                            }
                        },
                        wordOfDay: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                translation: { type: Type.STRING },
                                example: { type: Type.STRING }
                            },
                            required: ["word", "translation", "example"]
                        },
                        idiomOfDay: {
                            type: Type.OBJECT,
                            properties: {
                                idiom: { type: Type.STRING },
                                literalTranslation: { type: Type.STRING },
                                meaning: { type: Type.STRING },
                                example: { type: Type.STRING }
                            },
                            required: ["idiom", "literalTranslation", "meaning", "example"]
                        }
                    },
                    required: ["dailyPlan", "wordOfDay", "idiomOfDay"]
                }
            }
        });
        
        const data = JSON.parse(response.text);
        if (data.dailyPlan && data.wordOfDay && data.idiomOfDay) {
            return data as LearnScreenData;
        }
        console.error("Parsed data is missing required keys", data);
        return fallbackData;
    } catch (e) {
        console.error("Failed to parse or fetch Learn Screen Data JSON:", e);
        return fallbackData;
    }
};


export const getMistakeExplanation = async (userMessage: string, aiMessage: string, language: Language): Promise<string> => {
    const langName = language === Language.French ? "French" : "Arabic";
    const prompt = `I am a ${langName} language learner.
My message was: "${userMessage}"
My AI tutor responded with: "${aiMessage}"
The tutor's response contains a correction inside brackets like this: [...].

Please provide a simple, concise explanation in English of the main grammatical mistake I made, based on the correction provided by the tutor. Address me directly as "you". For example: "You used the wrong verb tense here..."`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text.trim();
};

export const getQuickTranslation = async (text: string, language: Language): Promise<string> => {
    const langName = language === Language.French ? "French" : "Arabic";
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following ${langName} text to English, providing only the translation itself: "${text}"`,
    });
    return response.text.trim();
};

export const getFluencyFeedback = async (messages: ChatMessage[], language: Language): Promise<{ score: number; tip: string }> => {
    const userMessages = messages.filter(m => m.sender === 'user').map(m => m.text);
    if(userMessages.length < 2) throw new Error("Not enough messages for feedback.");

    const prompt = `I am a student learning ${language}. Here are my last few messages in a conversation:\n\n${userMessages.map(m => `- ${m}`).join('\n')}\n\nBased on these messages, please provide a fluency score from 1-100 and one concise, actionable tip for improvement. Format the response as a JSON object with keys "score" and "tip".`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { 
                        type: Type.NUMBER,
                        description: "A fluency score from 1 to 100."
                    },
                    tip: {
                        type: Type.STRING,
                        description: "A single, concise tip for language improvement."
                    }
                },
                required: ["score", "tip"]
            }
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse fluency feedback JSON:", e, response.text);
        throw new Error("Could not get fluency feedback.");
    }
};

export const getConversationSummary = async (messages: ChatMessage[], language: Language): Promise<string> => {
    if(messages.length < 3) return "The conversation was too short to summarize.";
    const history = messages.map(m => `${m.sender}: ${m.text.replace(/\[.*?\]/g, '')}`).join('\n');
    const prompt = `Summarize the key topics discussed in the following ${language} conversation in 2-3 bullet points in English. \n\n${history}`;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const getPronunciationTips = async (text: string, language: Language): Promise<PronunciationTip[]> => {
    const langName = language === Language.French ? "French" : "Arabic";
    const prompt = `Analyze the following ${langName} text: "${text}". Identify up to 2 words that might be challenging for a learner to pronounce. For each word, provide a simple pronunciation tip in English. Return a JSON array of objects, where each object has keys "word" and "tip". If no words are challenging, return an empty array.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        tip: { type: Type.STRING }
                    },
                    required: ["word", "tip"]
                }
            }
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse pronunciation tips JSON:", e, response.text);
        return [];
    }
};

export const generateScenario = async (topic: string, language: Language): Promise<string> => {
    const langName = language === Language.French ? "French" : "Arabic";
    const prompt = `Generate a short, engaging, one-sentence conversation starter for a ${langName} language learner based on this topic: "${topic}". The starter should set a scene and prompt the user to speak first. For example, if the topic is "at a cafe", a good starter would be "You enter a cozy Parisian cafe and the barista asks, 'Bonjour, qu'est-ce que je vous sers ?'".`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
}

export const startFirstChallenge = async (language: Language, scenario: string): Promise<GameChallenge> => {
    const langName = language === Language.French ? "French" : "Arabic";
    const examplePrompt = language === Language.French 
        ? "You walk into the bakery and smell the fresh bread. The baker smiles and says 'Bonjour!'. What do you say?"
        : "You enter the bakery and the baker greets you with 'أهلاً بك!'. What do you say?";

    const prompt = `I am starting a language learning game. The language is ${langName} and the scenario is "${scenario}". Your task is to set the scene for the user and prompt them to start the conversation. Do not give them a specific task to perform. Instead, give them an open-ended prompt inviting them to speak. For example, if the scenario is "At the bakery", a good prompt would be "${examplePrompt}". Respond ONLY with a JSON object with a single key "challenge" containing this scene-setting prompt.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    challenge: {
                        type: Type.STRING,
                        description: "The first scene-setting prompt for the user in the game scenario."
                    }
                },
                required: ["challenge"]
            }
        }
    });
    const jsonResponse = JSON.parse(response.text);
    return { ...jsonResponse, scenario };
};

export const evaluateChallenge = async (language: Language, challenge: string, userAnswer: string): Promise<GameFeedback> => {
    const prompt = `Language learning game evaluation:
- Language: ${language}
- Scenario Challenge: "${challenge}"
- User's Answer: "${userAnswer}"

Please evaluate the user's answer and respond with the required JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: getGameSystemInstruction(language),
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    evaluation: { type: Type.STRING },
                    correction: { type: Type.STRING },
                    nextChallenge: { type: Type.STRING }
                },
                required: ["score", "evaluation", "correction", "nextChallenge"]
            }
        }
    });
    
    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse game evaluation JSON:", e, response.text);
        throw new Error("Could not evaluate the challenge answer.");
    }
};