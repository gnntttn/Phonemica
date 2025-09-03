import React from 'react';
import { Language } from '../types';
import { GlobeIcon } from './icons';

interface LanguageSelectorProps {
  onSelectLanguage: (language: Language) => void;
}

const LanguageButton: React.FC<{
  language: string;
  nativeName: string;
  flag: string;
  onClick: () => void;
}> = ({ language, nativeName, flag, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all duration-300"
  >
    <div className="text-4xl mr-4">{flag}</div>
    <div className="text-left">
      <h3 className="text-lg font-bold text-gray-800">{language}</h3>
      <p className="text-gray-500">{nativeName}</p>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-auto group-hover:text-teal-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  </button>
);

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelectLanguage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto text-center p-6 bg-white">
      <div className="text-teal-500 mb-6">
        <GlobeIcon />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome to Phonemica</h1>
      <p className="text-lg text-gray-600 mt-2 mb-10 max-w-xl">
        Your personal AI tutor for mastering pronunciation and conversational fluency. Choose your learning path to begin.
      </p>
      <div className="flex flex-col gap-4 w-full">
        <LanguageButton
          language="French"
          nativeName="Français"
          flag="🇫🇷"
          onClick={() => onSelectLanguage(Language.French)}
        />
        <LanguageButton
          language="Arabic"
          nativeName="العربية"
          flag="🇸🇦"
          onClick={() => onSelectLanguage(Language.Arabic)}
        />
      </div>
    </div>
  );
};

export default LanguageSelector;