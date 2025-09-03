import React, { useState, useEffect } from 'react';
import { Language, User, DailyPlanStep, LearnScreenData } from '../types';
import { ConversationIcon, TargetIcon, LightbulbIcon, IdeaIcon, BookIcon } from './icons';
import { getLearnScreenData } from '../services/geminiService';

interface LearnScreenProps {
  language: Language;
  onNavigate: (view: 'chat' | 'game') => void;
  streak: number;
  user: User;
  reviewWordsCount: number;
  onSwitchTab: (tab: 'learn' | 'review' | 'tools') => void;
}

const PlanStepCard: React.FC<{
  step: DailyPlanStep;
  icon: React.ReactNode;
  onClick: () => void;
  index: number;
}> = ({ step, icon, onClick, index }) => (
    <button onClick={onClick} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full text-left flex items-start group">
        <div className="mr-5 text-teal-500 bg-teal-100 p-3 rounded-xl transition-colors group-hover:bg-teal-500 group-hover:text-white">
            {icon}
        </div>
        <div>
            <p className="text-sm font-bold text-teal-500">STEP {index + 1}</p>
            <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
            <p className="text-gray-500 mt-1">{step.description}</p>
        </div>
    </button>
);


const DailyCard: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => {
    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center mb-3">
                {icon}
                <h3 className="text-md font-bold text-gray-800">{title}</h3>
            </div>
            {children}
        </div>
    );
};

const CircularProgress: React.FC<{ progress: number, goal: number, size: number, strokeWidth: number }> = ({ progress, goal, size, strokeWidth }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Cap progress at the goal to prevent overflow
    const cappedProgress = Math.min(progress, goal);
    const offset = circumference - (cappedProgress / goal) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="currentColor" strokeWidth={strokeWidth}
                fill="transparent"
                className="text-gray-200"
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="currentColor" strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="text-teal-500 transition-all duration-500 ease-in-out"
            />
        </svg>
    );
};

const LearnScreen: React.FC<LearnScreenProps> = ({ language, onNavigate, streak, user, reviewWordsCount, onSwitchTab }) => {
    const isArabic = language === Language.Arabic;
    const dir = isArabic ? 'rtl' : 'ltr';
    const fontClass = isArabic ? 'font-arabic' : '';
    const [learnData, setLearnData] = useState<LearnScreenData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await getLearnScreenData(language, reviewWordsCount);
                setLearnData(data);
            } catch (error) {
                console.error("Failed to fetch learn screen data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [language, reviewWordsCount]);

    const handlePlanStepClick = (action: DailyPlanStep['action']) => {
        if (action === 'review') {
            onSwitchTab('review');
        } else {
            onNavigate(action);
        }
    };
    
    const getIconForAction = (action: DailyPlanStep['action']) => {
        switch(action) {
            case 'review': return <BookIcon />;
            case 'chat': return <ConversationIcon />;
            case 'game': return <TargetIcon />;
            default: return <ConversationIcon />;
        }
    };

    return (
        <div className={`p-4 bg-gray-50 h-full overflow-y-auto ${fontClass}`} dir={dir}>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Phonemica
                </h1>
                <p className="text-gray-500 mt-1">
                    {isArabic ? 'كل يوم هو فرصة جديدة للتعلم. هيا بنا!' : "Another great day to learn. Let's get started!"}
                </p>
            </header>
            
            <div className="bg-white p-5 rounded-2xl shadow-md mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{isArabic ? 'الهدف اليومي' : 'Daily Goal'}</h2>
                <div className="relative flex items-center justify-center h-28">
                    <CircularProgress progress={user.dailyXP} goal={user.dailyGoal} size={110} strokeWidth={10} />
                    <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-bold text-teal-500">{user.dailyXP}</span>
                        <span className="text-gray-500 text-sm">/ {user.dailyGoal} XP</span>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{isArabic ? 'خطة اليوم' : 'Your Plan for Today'}</h2>
                <div className="grid grid-cols-1 gap-4">
                    {isLoading || !learnData ? (
                        [...Array(3)].map((_, i) => <div key={i} className="bg-white p-6 rounded-2xl shadow-md h-28 animate-pulse"></div>)
                    ) : (
                        learnData.dailyPlan.map((step, index) => (
                            <PlanStepCard
                                key={index}
                                index={index}
                                step={step}
                                icon={getIconForAction(step.action)}
                                onClick={() => handlePlanStepClick(step.action)}
                            />
                        ))
                    )}
                </div>
            </div>

             <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{isArabic ? 'إحماء يومي' : 'Daily Warm-up'}</h2>
                 {isLoading || !learnData ? (
                     <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white rounded-xl p-6 border border-gray-200 h-32 animate-pulse"></div>
                        <div className="bg-white rounded-xl p-6 border border-gray-200 h-32 animate-pulse"></div>
                     </div>
                 ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <DailyCard title={isArabic ? 'كلمة اليوم' : 'Word of the Day'} icon={<div className="text-yellow-600 mr-3"><LightbulbIcon /></div>}>
                            <div className={`my-2 ${fontClass}`}>
                                <p className="text-xl font-bold text-teal-600">{learnData.wordOfDay.word}</p>
                                <p className="text-gray-500 text-sm">{learnData.wordOfDay.translation}</p>
                            </div>
                            <p className="text-xs text-gray-500 italic">
                                <span className={fontClass}>"{learnData.wordOfDay.example}"</span>
                            </p>
                        </DailyCard>

                        <DailyCard title={isArabic ? 'مصطلح اليوم' : 'Idiom of the Day'} icon={<div className="text-sky-600 mr-3"><IdeaIcon /></div>}>
                            <div className={`my-2 ${fontClass}`}>
                                <p className="text-lg font-bold text-sky-600">"{learnData.idiomOfDay.idiom}"</p>
                            </div>
                            <p className="text-xs text-gray-600"><span className="font-semibold">{isArabic ? 'المعنى: ' : 'Means: '}</span>{learnData.idiomOfDay.meaning}</p>
                        </DailyCard>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default LearnScreen;