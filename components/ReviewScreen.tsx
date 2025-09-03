import React, { useState, useEffect, useCallback } from 'react';
import { Language, ReviewWord } from '../types';
import { BookIcon, RefreshIcon, CheckCircleIcon } from './icons';

interface ReviewScreenProps {
  words: ReviewWord[];
  language: Language;
  onUpdateWordLevel: (id: string, currentLevel: number) => void;
}

const Flashcard: React.FC<{ 
    word: ReviewWord, 
    isArabic: boolean, 
    fontClass: string,
    onMarkLearned: (id: string, currentLevel: number) => void;
}> = ({ word, isArabic, fontClass, onMarkLearned }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleMarkLearnedClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the card from flipping when clicking the button
        onMarkLearned(word.id, word.level);
    };

    return (
        <div className="w-full h-40 [perspective:1000px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                {/* Front of card */}
                <div className="absolute w-full h-full bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center p-4 [backface-visibility:hidden]">
                    <p className={`text-3xl font-bold text-center text-gray-800 ${fontClass}`}>
                        {word.word}
                    </p>
                </div>
                {/* Back of card */}
                <div className="absolute w-full h-full bg-teal-500 border-2 border-teal-600 text-white rounded-xl flex flex-col items-center justify-center p-4 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                     <p className="text-2xl font-semibold text-center">
                        {word.translation}
                    </p>
                     <button 
                        onClick={handleMarkLearnedClick} 
                        className="absolute bottom-2 right-2 p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                        aria-label="Mark as learned"
                        title="Mark as learned"
                    >
                        <CheckCircleIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ReviewScreen: React.FC<ReviewScreenProps> = ({ words, language, onUpdateWordLevel }) => {
    const isArabic = language === Language.Arabic;
    const dir = isArabic ? 'rtl' : 'ltr';
    const fontClass = isArabic ? 'font-arabic' : '';
    const [shuffledWords, setShuffledWords] = useState<ReviewWord[]>([]);

    const shuffleWords = useCallback(() => {
        setShuffledWords([...words].sort(() => Math.random() - 0.5));
    }, [words]);

    useEffect(() => {
        shuffleWords();
    }, [shuffleWords, words]);

    return (
        <div className={`p-4 bg-gray-50 h-full ${fontClass}`} dir={dir}>
            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{isArabic ? 'مراجعة' : 'Review'}</h1>
                        <p className="text-gray-600">{isArabic ? `لديك ${words.length} كلمة للمراجعة اليوم.` : `You have ${words.length} words to review today.`}</p>
                    </div>
                    {words.length > 1 && (
                        <button 
                            onClick={shuffleWords} 
                            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-200 rounded-full transition-colors"
                            aria-label="Shuffle words"
                            title="Shuffle words"
                        >
                            <RefreshIcon />
                        </button>
                    )}
                </div>
            </header>
            
            {shuffledWords.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {shuffledWords.map(word => (
                        <Flashcard key={word.id} word={word} isArabic={isArabic} fontClass={fontClass} onMarkLearned={onUpdateWordLevel} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 mt-[-6rem]">
                    <div className="p-4 bg-gray-200 rounded-full mb-4">
                        <BookIcon />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{isArabic ? 'لا يوجد شيء للمراجعة' : 'Nothing to Review'}</h2>
                    <p className="max-w-xs">{isArabic ? 'أحسنت! ستظهر الكلمات الجديدة هنا عندما يحين وقت مراجعتها. استمر في التعلم!' : 'Great job! New words will appear here when it\'s time to review them. Keep learning!'}</p>
                </div>
            )}
        </div>
    );
};

export default ReviewScreen;