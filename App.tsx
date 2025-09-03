import React, { useState, useEffect } from 'react';
import { Language, ReviewWord, User } from './types';
import LanguageSelector from './components/LanguageSelector';
import ChatView from './components/ChatView';
import GameView from './components/GameView';
import LearnScreen from './components/LearnScreen';
import BottomNav from './components/BottomNav';
import ReviewScreen from './components/ReviewScreen';
import ToolsScreen from './components/ToolsScreen';
import { getTodayString, getFutureDateString } from './utils/dateHelper';
import { getStreak, updateStreak } from './utils/streakHelper';

const AppShell: React.FC<{
  language: Language;
  onNavigate: (view: 'chat' | 'game') => void;
  reviewWords: ReviewWord[];
  onUpdateReviewWord: (id: string, level: number, details?: { word: string; translation: string; }) => void;
  streak: number;
  user: User;
}> = ({ language, onNavigate, reviewWords, onUpdateReviewWord, streak, user }) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'review' | 'tools'>('learn');
  const today = getTodayString();
  const wordsForReview = reviewWords.filter(w => w.reviewDate <= today);


  const renderActiveTab = () => {
    switch (activeTab) {
      case 'learn':
        return <LearnScreen 
                  onNavigate={onNavigate} 
                  language={language} 
                  streak={streak} 
                  user={user} 
                  reviewWordsCount={wordsForReview.length}
                  onSwitchTab={setActiveTab}
                />;
      case 'review':
        return <ReviewScreen words={wordsForReview} language={language} onUpdateWordLevel={onUpdateReviewWord} />;
      case 'tools':
        return <ToolsScreen language={language} onAddWord={(word, translation) => onUpdateReviewWord(Date.now().toString(), 0, { word, translation })} />;
      default:
        return <LearnScreen 
                  onNavigate={onNavigate} 
                  language={language} 
                  streak={streak} 
                  user={user} 
                  reviewWordsCount={wordsForReview.length}
                  onSwitchTab={setActiveTab}
                />;
    }
  };

  return (
    <div className="flex flex-col w-full h-full max-w-md mx-auto bg-white overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        {renderActiveTab()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};


const App: React.FC = () => {
  const [language, setLanguage] = useState<Language | null>(null);
  const [view, setView] = useState<'lang' | 'app' | 'chat' | 'game'>('lang');
  const [reviewWords, setReviewWords] = useState<ReviewWord[]>(() => {
    const savedWords = localStorage.getItem('reviewWords');
    return savedWords ? JSON.parse(savedWords) : [];
  });
  const [streak, setStreak] = useState(0);
  const [user, setUser] = useState<User>({ name: 'Alex', dailyXP: 0, dailyGoal: 100 });
  
  useEffect(() => {
    localStorage.setItem('reviewWords', JSON.stringify(reviewWords));
  }, [reviewWords]);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  const handleSelectLanguage = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setView('app');
  };
  
  const handleNavigate = (newView: 'chat' | 'game') => {
    setView(newView);
  };
  
  const handleSessionComplete = (sessionType: 'chat' | 'game') => {
    const xpGained = sessionType === 'chat' ? 20 : 30;
    const newStreak = updateStreak();
    setStreak(newStreak);
    setUser(prev => ({
        ...prev,
        dailyXP: Math.min(prev.dailyXP + xpGained, prev.dailyGoal)
    }));
    setView('app');
  };

  const handleAddOrUpdateReviewWord = (
    id: string, 
    level: number, 
    details?: { word: string; translation: string }
) => {
    setReviewWords(prev => {
        const existingWordIndex = prev.findIndex(w => w.id === id || (details && w.word.toLowerCase() === details.word.toLowerCase()));
        const intervals = [1, 3, 7, 14, 30, 90]; // Spaced repetition intervals in days
        const nextLevel = level + 1;
        const nextReviewDate = getFutureDateString(intervals[Math.min(level, intervals.length - 1)]);

        if (existingWordIndex > -1) {
            // Update existing word
            const updatedWords = [...prev];
            updatedWords[existingWordIndex] = {
                ...updatedWords[existingWordIndex],
                level: nextLevel,
                reviewDate: nextReviewDate
            };
            return updatedWords;
        } else if (details) {
            // Add new word
            const newWord: ReviewWord = {
                id: Date.now().toString(),
                word: details.word,
                translation: details.translation,
                level: 0,
                reviewDate: getTodayString()
            };
            return [...prev, newWord];
        }
        return prev;
    });
};

  const renderContent = () => {
    if (!language || view === 'lang') {
      return <LanguageSelector onSelectLanguage={handleSelectLanguage} />;
    }
    
    switch (view) {
      case 'chat':
        return <ChatView language={language} onBack={() => handleSessionComplete('chat')} onNewWord={(word, trans) => handleAddOrUpdateReviewWord('', 0, {word, translation: trans})} />;
      case 'game':
        return <GameView language={language} onBack={() => handleSessionComplete('game')} />;
      case 'app':
      default:
        return <AppShell language={language} onNavigate={handleNavigate} reviewWords={reviewWords} onUpdateReviewWord={handleAddOrUpdateReviewWord} streak={streak} user={user} />;
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 h-[100dvh] flex flex-col items-center justify-center font-sans antialiased">
       {renderContent()}
    </div>
  );
};

export default App;