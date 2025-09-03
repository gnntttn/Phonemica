import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, ChatMessage, Sender, FluencyFeedback, PronunciationTip } from '../types';
import { createTutorChat, getFluencyFeedback, getConversationSummary, getPronunciationTips, generateSceneImage, getMistakeExplanation } from '../services/geminiService';
import { SCENARIOS } from '../constants';
import { Chat } from '@google/genai';
import CallControls from './ChatInput';
import { BackIcon, AnalyticsIcon, SettingsIcon, LightbulbIcon, SoundWaveIcon, QuestionMarkCircleIcon } from './icons';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const ExplanationModal: React.FC<{
    explanation: string;
    isLoading: boolean;
    onClose: () => void;
    isArabic: boolean;
}> = ({ explanation, isLoading, onClose, isArabic }) => (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-teal-500 mb-4 text-center">{isArabic ? 'شرح الخطأ' : 'Mistake Explanation'}</h3>
            {isLoading ? (
                <div className="flex justify-center items-center h-24"><svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
            ) : (
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-gray-700">{explanation}</p>
                </div>
            )}
            <button onClick={onClose} className="mt-6 w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                {isArabic ? 'فهمت' : 'Got it'}
            </button>
        </div>
    </div>
);


const SessionReportModal: React.FC<{ 
    messages: ChatMessage[]; 
    language: Language; 
    onClose: () => void; 
    isArabic: boolean; 
}> = ({ messages, language, onClose, isArabic }) => {
    const [activeTab, setActiveTab] = useState<'feedback' | 'summary'>('feedback');
    const [feedback, setFeedback] = useState<FluencyFeedback | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [feedbackData, summaryData] = await Promise.all([
                getFluencyFeedback(messages, language),
                getConversationSummary(messages, language)
            ]);
            setFeedback(feedbackData);
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to fetch session report:", error);
            setFeedback({ score: 0, tip: "Could not load feedback."});
            setSummary("Could not load summary.");
        } finally {
            setIsLoading(false);
        }
    }, [messages, language]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-48"><svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
        }
        if (activeTab === 'feedback' && feedback) {
            return (
                <div>
                    <div className="my-6 text-center">
                        <div className="text-6xl font-bold text-gray-800">{feedback.score}<span className="text-2xl text-gray-400">/100</span></div>
                        <p className="text-gray-500 mt-1">{isArabic ? 'درجة الطلاقة' : 'Fluency Score'}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">{isArabic ? '💡 نصيحتك للتحسين:' : '💡 Your Tip for Improvement:'}</h4>
                        <p className="text-gray-600">{feedback.tip}</p>
                    </div>
                </div>
            );
        }
        if (activeTab === 'summary' && summary) {
             return (
                <div className="bg-gray-100 p-4 rounded-lg my-4">
                     <h4 className="font-semibold text-gray-800 mb-2">{isArabic ? 'ملخص المحادثة' : 'Conversation Summary'}</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                        {summary.split('\n').map((item, index) => item.trim() && <li key={index}>{item.replace(/^- /, '')}</li>)}
                    </ul>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-teal-500 mb-4 text-center">{isArabic ? 'تقرير الجلسة' : 'Session Report'}</h3>
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('feedback')} className={`flex-1 py-2 text-center font-semibold ${activeTab === 'feedback' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>{isArabic ? 'ملاحظات' : 'Feedback'}</button>
                    <button onClick={() => setActiveTab('summary')} className={`flex-1 py-2 text-center font-semibold ${activeTab === 'summary' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>{isArabic ? 'ملخص' : 'Summary'}</button>
                </div>
                <div className="mt-4">{renderContent()}</div>
                <button onClick={onClose} className="mt-6 w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {isArabic ? 'إغلاق' : 'Close'}
                </button>
            </div>
        </div>
    )
};

const PronunciationModal: React.FC<{ text: string; language: Language; onClose: () => void; isArabic: boolean; }> = ({ text, language, onClose, isArabic }) => {
    const [tips, setTips] = useState<PronunciationTip[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTips = async () => {
            setIsLoading(true);
            const fetchedTips = await getPronunciationTips(text, language);
            setTips(fetchedTips);
            setIsLoading(false);
        };
        fetchTips();
    }, [text, language]);

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-teal-500 mb-4 text-center">{isArabic ? 'نصائح النطق' : 'Pronunciation Tips'}</h3>
                {isLoading ? (
                     <div className="flex justify-center items-center h-24"><svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
                ) : tips.length > 0 ? (
                    <div className="space-y-4">
                        {tips.map((tip, index) => (
                            <div key={index} className="bg-gray-100 p-3 rounded-lg">
                                <p className={`font-bold text-lg text-teal-600 ${isArabic ? 'font-arabic' : ''}`}>{tip.word}</p>
                                <p className="text-gray-700">{tip.tip}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-600 my-8">{isArabic ? 'نطق رائع! لا توجد نصائح لهذه الجملة.' : 'Great pronunciation! No tips for this sentence.'}</p>
                )}
                <button onClick={onClose} className="mt-6 w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {isArabic ? 'فهمت' : 'Got it'}
                </button>
            </div>
        </div>
    )
}

const TranscriptItem: React.FC<{ 
    message: ChatMessage; 
    previousMessage?: ChatMessage;
    onPlay: () => void; 
    onAnalyze: () => void; 
    isArabic: boolean; 
    onExplain: (userMessage: ChatMessage, aiMessage: ChatMessage) => void;
}> = ({ message, previousMessage, onPlay, onAnalyze, isArabic, onExplain }) => {
    const isUser = message.sender === Sender.User;
    const isAI = message.sender === Sender.AI;
    const hasCorrection = isAI && message.text.includes('[') && previousMessage?.sender === Sender.User;

    const renderMessageText = () => {
        const parts = message.text.split(/(\[.*?\])|(Cultural Tip:.*)/g).filter(Boolean);
        return parts.map((part, index) => {
            if (part.match(/(\[.*?\])/g)) {
                return (
                    <span key={index} className="text-green-600 italic block mt-1 text-sm">
                        {part.slice(1, -1)}
                    </span>
                );
            }
            if (part.startsWith('Cultural Tip:')) {
                return (
                    <span key={index} className="block bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-2 rounded-md mt-2 text-sm">
                        <LightbulbIcon /> {part}
                    </span>
                )
            }
            return part;
        });
    };
    
    return (
        <div className={`flex items-start gap-2 w-full ${isUser ? 'justify-end' : 'justify-start'} ${isArabic ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center gap-2 max-w-xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-lg">
                    {isUser ? '🧑‍💻' : '🤖'}
                </div>
                <div className={`p-3 rounded-lg relative ${isUser ? 'bg-gradient-to-br from-teal-400 to-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    <p className="whitespace-pre-wrap">{renderMessageText()}</p>
                     {hasCorrection && (
                        <button onClick={() => onExplain(previousMessage!, message)} className="absolute -bottom-2 -right-2 p-1 bg-white rounded-full text-purple-500 hover:bg-purple-100 transition-colors shadow" aria-label="Explain mistake">
                            <QuestionMarkCircleIcon />
                        </button>
                    )}
                </div>
                <div className="flex flex-col space-y-1">
                {isAI && (
                     <button onClick={onPlay} className="p-2 rounded-full text-gray-400 hover:bg-teal-500 hover:text-white transition-colors" aria-label="Play audio">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
                {isUser && (
                     <button onClick={onAnalyze} className="p-2 rounded-full text-gray-400 hover:bg-purple-500 hover:text-white transition-colors" aria-label="Analyze pronunciation">
                        <SoundWaveIcon />
                    </button>
                )}
                </div>
            </div>
        </div>
    );
};

interface ChatViewProps {
  language: Language;
  onBack: () => void;
  onNewWord: (word: string, translation: string) => void;
  initialScenario?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ language, onBack, onNewWord, initialScenario }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [scenario, setScenario] = useState<string | undefined>(initialScenario);
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pronunciationText, setPronunciationText] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const chatSessionRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMessages = messages.filter(m => m.sender === Sender.User);
  
  const isArabic = language === Language.Arabic;
  const dir = isArabic ? 'rtl' : 'ltr';
  const fontClass = isArabic ? 'font-arabic' : '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, [])

  useEffect(scrollToBottom, [messages]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]|Cultural Tip:.*|\[\/VOCAB\].*|\[VOCAB\].*/g, ''));
      const langCode = language === Language.French ? 'fr' : 'ar';
      const selectedVoice = voices.find(voice => voice.lang.startsWith(langCode));
      if (selectedVoice) {
          utterance.voice = selectedVoice;
      }
      utterance.lang = language === Language.French ? 'fr-FR' : 'ar-SA';
      utterance.rate = speechRate;
      window.speechSynthesis.speak(utterance);
    }
  }, [language, voices, speechRate]);

  const initializeChat = useCallback(async (selectedScenario?: string) => {
    setIsLoading(true);
    setMessages([]);
    setScenario(selectedScenario);
    setSceneImageUrl(null);
    setIsImageLoading(false);

    if (selectedScenario) {
        setIsImageLoading(true);
        // Generate image in parallel without blocking UI
        generateSceneImage(selectedScenario, language).then(url => {
            setSceneImageUrl(url);
            setIsImageLoading(false);
        });
    }

    try {
      chatSessionRef.current = createTutorChat(language, selectedScenario);

      if (selectedScenario) {
        const response = await chatSessionRef.current.sendMessage({ message: "(Start the conversation now based on the scenario)" });
        const aiMessage: ChatMessage = { id: 'init-scenario', sender: Sender.AI, text: response.text };
        setMessages([aiMessage]);
        speak(response.text);
      } else {
        const welcomeText = language === Language.French 
          ? "Bonjour ! Prêt à pratiquer votre français ? Vous pouvez choisir un scénario ci-dessous ou simplement commencer à discuter."
          : "أهلاً بك! هل أنت مستعد لممارسة لغتك العربية؟ يمكنك اختيار سيناريو أدناه أو البدء في الدردشة مباشرة.";
        setMessages([{ id: 'init', sender: Sender.AI, text: welcomeText }]);
        speak(welcomeText);
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setMessages([{ id: 'error', sender: Sender.System, text: 'Error: Could not initialize AI tutor. Please check your API key and refresh.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [language, speak]);

  useEffect(() => {
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === Language.French ? 'fr-FR' : 'ar-SA';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSendMessage(transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);


  useEffect(() => {
    initializeChat(scenario);
  }, [initializeChat]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), sender: Sender.User, text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) throw new Error("Chat session not initialized.");
      const response = await chatSessionRef.current.sendMessage({ message: text });
      
      let aiText = response.text;
      const vocabRegex = /\[VOCAB\](.*?)\[\/VOCAB\]/s;
      const match = aiText.match(vocabRegex);

      if (match && match[1]) {
        try {
          const vocabData = JSON.parse(match[1]);
          if(vocabData.word && vocabData.translation){
            onNewWord(vocabData.word, vocabData.translation);
          }
        } catch (e) { console.error("Failed to parse vocabulary JSON:", e); }
        aiText = aiText.replace(vocabRegex, "").trim();
      }

      const aiMessage: ChatMessage = { id: Date.now().toString() + '-ai', sender: Sender.AI, text: aiText };
      setMessages(prev => [...prev, aiMessage]);
      speak(aiText);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = { id: Date.now().toString() + '-err', sender: Sender.System, text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };
  
  const handleExplainMistake = async (userMessage: ChatMessage, aiMessage: ChatMessage) => {
    setIsExplaining(true);
    setExplanation('');
    try {
        const result = await getMistakeExplanation(userMessage.text, aiMessage.text, language);
        setExplanation(result);
    } catch (e) {
        setExplanation("Sorry, I couldn't get an explanation at this time.");
    }
  };

  const getStatusText = () => {
    const texts = {
        thinking: isArabic ? 'المعلم يفكر...' : 'Tutor is thinking...',
        listening: isArabic ? 'يستمع...' : 'Listening...',
        ready: isArabic ? 'المعلم جاهز' : 'Tutor is ready',
        connected: isArabic ? 'متصل' : 'Connected',
    };
    if (isLoading) return texts.thinking;
    if (isRecording) return texts.listening;
    return texts.ready;
  };

  return (
    <>
    {showReport && <SessionReportModal messages={messages} language={language} onClose={() => setShowReport(false)} isArabic={isArabic} />}
    {pronunciationText && <PronunciationModal text={pronunciationText} language={language} onClose={() => setPronunciationText(null)} isArabic={isArabic} />}
    {explanation !== null && (
        <ExplanationModal
            explanation={explanation}
            isLoading={isExplaining}
            onClose={() => { setExplanation(null); setIsExplaining(false); }}
            isArabic={isArabic}
        />
    )}
    <div className={`flex flex-col h-full w-full bg-white ${fontClass}`} dir={dir}>
      <header className="relative flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors">
            <BackIcon />
        </button>
        <h2 className="text-lg font-bold text-center text-gray-900">{scenario || (isArabic ? "ممارسة المحادثة" : "Conversation Practice")}</h2>
        <div className="flex items-center space-x-1">
             <button onClick={() => setShowReport(true)} disabled={userMessages.length < 2} className="p-2 text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <AnalyticsIcon />
            </button>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-500 hover:text-gray-800 transition-colors">
                <SettingsIcon />
            </button>
        </div>
         {showSettings && (
            <div className="absolute top-full right-2 mt-2 w-48 bg-white rounded-lg shadow-xl border z-20">
                <p className="text-sm font-semibold text-gray-600 px-3 py-2 border-b">{isArabic ? 'سرعة الكلام' : 'Speech Speed'}</p>
                <div className="p-2">
                    {[ {label: isArabic ? 'بطيء' : 'Slow', rate: 0.7}, {label: isArabic ? 'عادي' : 'Normal', rate: 1.0}, {label: isArabic ? 'سريع' : 'Fast', rate: 1.3}].map(opt => (
                        <button key={opt.rate} onClick={() => { setSpeechRate(opt.rate); setShowSettings(false); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${speechRate === opt.rate ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {(isImageLoading || sceneImageUrl) && (
            <div className="relative h-40 bg-gray-200 -mx-4 -mt-4 mb-4 rounded-b-lg overflow-hidden shadow">
                {isImageLoading && <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse"><p className="text-gray-500">{isArabic ? 'جاري إنشاء المشهد...' : 'Generating scene...'}</p></div>}
                {sceneImageUrl && <img src={sceneImageUrl} alt={scenario || 'conversation scene'} className="w-full h-full object-cover" />}
            </div>
        )}
        {!scenario && (
            <div className="pb-4">
                 <p className="text-center text-sm text-gray-500 mb-3">{isArabic ? 'أو اختر سيناريو للتدريب:' : 'Or choose a practice scenario:'}</p>
                <div className={`flex flex-wrap justify-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {SCENARIOS[language].map(sc => (
                        <button key={sc} onClick={() => initializeChat(sc)} className="px-3 py-1.5 bg-gray-200 hover:bg-teal-100 text-gray-700 hover:text-teal-800 rounded-full text-xs font-medium transition-colors">
                            {sc}
                        </button>
                    ))}
                </div>
            </div>
        )}
        <div className="text-center text-sm text-gray-400 tracking-wider uppercase py-2">{getStatusText()}</div>
        <div className="space-y-6">
            {messages.map((msg, idx) => (
                <TranscriptItem 
                    key={msg.id} 
                    message={msg} 
                    previousMessage={messages[idx-1]}
                    onPlay={() => speak(msg.text)} 
                    onAnalyze={() => setPronunciationText(msg.text)} 
                    isArabic={isArabic} 
                    onExplain={handleExplainMistake}
                />
            ))}
        </div>
        <div ref={messagesEndRef} />
      </main>
      <footer className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
        <CallControls
          isLoading={isLoading} 
          isRecording={isRecording} 
          onToggleRecording={handleToggleRecording}
          hasSpeechApi={!!SpeechRecognition}
        />
      </footer>
    </div>
    </>
  );
};

export default ChatView;