import React, { useState, useEffect, useRef } from 'react';
import { Language, GameChallenge, GameFeedback } from '../types';
import { startFirstChallenge, evaluateChallenge, generateSceneImage } from '../services/geminiService';
import { GAME_SCENARIOS } from '../constants';
import CallControls from './ChatInput';
import { BackIcon, RefreshIcon } from './icons';

interface GameViewProps {
  language: Language;
  onBack: () => void;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const Stars: React.FC<{ score: number }> = ({ score }) => (
    <div className="flex justify-center text-2xl text-yellow-400">
        {[...Array(3)].map((_, i) => (
            <span key={i} className={`transition-opacity duration-500 ${i < score ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
        ))}
    </div>
);

interface GameMessage {
    id: string;
    sender: 'ai' | 'user' | 'feedback';
    text: string;
    feedback?: GameFeedback;
}

const GameMessageBubble: React.FC<{ message: GameMessage; isArabic: boolean; fontClass: string; }> = ({ message, isArabic, fontClass }) => {
    if (message.sender === 'user') {
        return (
             <div className="flex justify-end">
                <div className="p-3 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 text-white max-w-lg">
                    {message.text}
                </div>
            </div>
        );
    }
    if (message.sender === 'feedback' && message.feedback) {
         return (
            <div className="my-2 bg-gray-100 p-3 rounded-lg border border-gray-200 text-center">
                <Stars score={message.feedback.score} />
                <p className="font-semibold my-2 text-gray-800">{message.feedback.evaluation}</p>
                {message.feedback.correction && (
                    <p className={`text-green-600 ${fontClass}`}>
                        <span className="text-gray-500 text-sm">{isArabic ? 'الأفضل أن تقول: ' : 'Try saying: '}</span>
                        {message.feedback.correction}
                    </p>
                )}
            </div>
        );
    }
    return (
        <div className="flex justify-start">
            <div className={`p-3 rounded-lg bg-gray-200 text-gray-800 max-w-lg ${fontClass}`}>
                {message.text}
            </div>
        </div>
    );
}


const GameView: React.FC<GameViewProps> = ({ language, onBack }) => {
    const [gameState, setGameState] = useState<'selecting' | 'playing' | 'loading'>('selecting');
    const [scenario, setScenario] = useState<string | null>(null);
    const [currentChallenge, setCurrentChallenge] = useState<string | null>(null);
    const [messages, setMessages] = useState<GameMessage[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isArabic = language === Language.Arabic;
    const dir = isArabic ? 'rtl' : 'ltr';
    const fontClass = isArabic ? 'font-arabic' : '';

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);

    const handleSelectScenario = async (selectedScenario: string) => {
        setScenario(selectedScenario);
        setGameState('loading');
        setError(null);
        setMessages([]);
        setSceneImageUrl(null);

        setIsImageLoading(true);
        generateSceneImage(selectedScenario, language).then(url => {
            setSceneImageUrl(url);
            setIsImageLoading(false);
        });
        
        try {
            const firstChallenge = await startFirstChallenge(language, selectedScenario);
            setCurrentChallenge(firstChallenge.challenge);
            setMessages([{ id: 'start', sender: 'ai', text: firstChallenge.challenge }]);
            setGameState('playing');
        } catch (err) {
            setError('Could not start the game. Please try again.');
            setGameState('selecting');
        }
    };
    
    const handleUserAnswer = async (answer: string) => {
        if (!currentChallenge) return;
        setGameState('loading');
        setIsRecording(false);
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: answer }]);
        
        try {
            const result = await evaluateChallenge(language, currentChallenge, answer);
            setMessages(prev => [...prev, { id: Date.now().toString() + 'fb', sender: 'feedback', text: '', feedback: result }]);
            
            if(result.nextChallenge) {
                 setCurrentChallenge(result.nextChallenge);
                 setTimeout(() => {
                    setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: result.nextChallenge as string }]);
                    setGameState('playing');
                }, 500);
            } else {
                 setGameState('playing'); // Or maybe a 'finished' state
            }
        } catch (err) {
            setError('Could not evaluate your answer. Please try again.');
            setGameState('playing');
        }
    };
        
    const handleReset = () => {
        setScenario(null);
        setCurrentChallenge(null);
        setMessages([]);
        setError(null);
        setGameState('selecting');
        setSceneImageUrl(null);
        setIsImageLoading(false);
    };

    useEffect(() => {
        if (!SpeechRecognition) return;
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === Language.French ? 'fr-FR' : 'ar-SA';
    
        recognition.onresult = (event: any) => handleUserAnswer(event.results[0][0].transcript);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [language, currentChallenge]);
      
    const handleToggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
        setIsRecording(!isRecording);
    };

    return (
        <div className={`flex flex-col h-full w-full bg-white ${fontClass}`} dir={dir}>
            <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors">
                    <BackIcon />
                </button>
                <h2 className="text-lg font-bold text-center text-gray-900">{scenario || (isArabic ? 'مدرب التحدث' : 'Speak Coach')}</h2>
                <div className="w-8">
                {gameState !== 'selecting' && (
                    <button onClick={handleReset} className="p-2 -mr-2 text-gray-500 hover:text-gray-800 transition-colors" title={isArabic ? 'لعبة جديدة' : 'New Game'}>
                       <RefreshIcon />
                    </button>
                )}
                </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-gray-50">
                {error && <p className="text-red-500 text-center p-2">{error}</p>}
                
                {gameState === 'selecting' ? (
                     <div className="text-center p-6 flex flex-col items-center justify-center h-full">
                        <h3 className="text-2xl font-bold mb-4 text-gray-900">{isArabic ? 'اختر سيناريو' : 'Choose a Scenario'}</h3>
                        <div className={`flex flex-wrap justify-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            {GAME_SCENARIOS[language].map(sc => (
                                <button key={sc} onClick={() => handleSelectScenario(sc)} className="px-4 py-2 bg-gray-200 hover:bg-teal-100 text-gray-700 hover:text-teal-800 rounded-full text-base font-medium transition-colors">
                                    {sc}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {(isImageLoading || sceneImageUrl) && (
                            <div className="relative h-40 bg-gray-200 shadow-md">
                                {isImageLoading && <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse"><p className="text-gray-500">{isArabic ? 'جاري إنشاء المشهد...' : 'Generating scene...'}</p></div>}
                                {sceneImageUrl && <img src={sceneImageUrl} alt={scenario || 'game scene'} className="w-full h-full object-cover" />}
                            </div>
                        )}
                        <div className="p-4 space-y-4">
                            {messages.map(msg => <GameMessageBubble key={msg.id} message={msg} isArabic={isArabic} fontClass={fontClass}/>)}
                            <div ref={messagesEndRef} />
                        </div>
                    </>
                )}
            </main>
            <footer className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
                {gameState === 'playing' || gameState === 'loading' ? (
                     <CallControls 
                        isLoading={gameState === 'loading'}
                        isRecording={isRecording} 
                        onToggleRecording={handleToggleRecording}
                        hasSpeechApi={!!SpeechRecognition}
                     />
                ) : null }
            </footer>
        </div>
    );
};

export default GameView;