import React from 'react';
import { HomeIcon, BookIcon, TranslateIcon } from './icons';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: 'learn' | 'review' | 'tools') => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    const activeClass = isActive ? 'text-teal-500' : 'text-gray-400';
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors hover:text-teal-500 ${activeClass}`}>
            {icon}
            <span className="text-xs font-medium mt-1">{label}</span>
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <nav className="flex items-center justify-around w-full h-16 bg-white/80 backdrop-blur-sm border-t border-gray-200">
            <NavItem
                label="Learn"
                icon={<HomeIcon />}
                isActive={activeTab === 'learn'}
                onClick={() => onTabChange('learn')}
            />
            <NavItem
                label="Review"
                icon={<BookIcon />}
                isActive={activeTab === 'review'}
                onClick={() => onTabChange('review')}
            />
             <NavItem
                label="Tools"
                icon={<TranslateIcon />}
                isActive={activeTab === 'tools'}
                onClick={() => onTabChange('tools')}
            />
        </nav>
    );
};

export default BottomNav;