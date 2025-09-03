import React, { useState } from 'react';
import { Language } from '../types';
import { getQuickTranslation } from '../services/geminiService';
import { TranslateIcon, PlusCircleIcon } from './icons';

interface ToolsScreenProps {
    language: Language;
    onAddWord: (word: string, translation: string) => void;
}

const ToolsScreen: React.FC<ToolsScreenProps> = ({ language, onAddWord }) => {
    const [text, setText] = useState('');
    const [translation, setTranslation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [added, setAdded] = useState(false);

    const isArabic = language === Language.Arabic;
    const dir = isArabic ? 'rtl' : 'ltr';
    const fontClass = isArabic ? 'font-arabic' : '';

    const handleTranslate = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setTranslation('');
        setAdded(false);
        try {
            const result = await getQuickTranslation(text, language);
            setTranslation(result);
        } catch (e) {
            console.error(e);
            setTranslation(isArabic ? 'فشل في الترجمة.' : 'Failed to translate.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        if (text && translation) {
            onAddWord(text, translation);
            setAdded(true);
        }
    }

    return (
        <div className={`p-4 bg-gray-50 h-full ${fontClass}`} dir={dir}>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{isArabic ? 'أدوات' : 'Tools'}</h1>
                <p className="text-gray-600">{isArabic ? 'ترجمة سريعة للكلمات والعبارات.' : 'Quickly translate words and phrases.'}</p>
            </header>

            <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full mr-3">
                        <TranslateIcon />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{isArabic ? 'المترجم' : 'Translator'}</h3>
                </div>
                
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={isArabic ? 'اكتب نصًا للترجمة...' : 'Enter text to translate...'}
                    className={`w-full p-3 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition ${fontClass}`}
                />
                <button 
                    onClick={handleTranslate} 
                    disabled={isLoading}
                    className="w-full mt-3 bg-gradient-to-br from-teal-400 to-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 transition"
                >
                     {isLoading ? (
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     ) : (
                        isArabic ? 'ترجمة' : 'Translate'
                     )}
                </button>

                {translation && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg relative">
                        <p className="font-semibold text-gray-800">{translation}</p>
                        <button 
                            onClick={handleAdd}
                            disabled={added}
                            className="absolute top-2 right-2 p-1 text-teal-500 hover:text-teal-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                            title={added ? (isArabic ? 'تمت الإضافة' : 'Added') : (isArabic ? 'إضافة للمراجعة' : 'Add to review')}
                        >
                           <PlusCircleIcon filled={added} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolsScreen;