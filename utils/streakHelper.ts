import { getTodayString } from './dateHelper';

interface StreakData {
    count: number;
    lastCompletedDate: string;
}

export const getStreak = (): number => {
    const data = localStorage.getItem('streakData');
    if (!data) return 0;

    const streak: StreakData = JSON.parse(data);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const lastDate = new Date(streak.lastCompletedDate);

    // If last completed date is not yesterday or today, streak is broken
    if (lastDate.toDateString() !== yesterday.toDateString() && lastDate.toDateString() !== today.toDateString()) {
        return 0;
    }

    return streak.count;
};

export const updateStreak = (): number => {
    const todayStr = getTodayString();
    const data = localStorage.getItem('streakData');
    
    let streak: StreakData = data ? JSON.parse(data) : { count: 0, lastCompletedDate: '' };

    if (streak.lastCompletedDate === todayStr) {
        return streak.count; // Already completed today
    }

    const yesterday = new Date();
    yesterday.setDate(new Date().getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastCompletedDate === yesterdayStr) {
        streak.count += 1; // Increment streak
    } else {
        streak.count = 1; // Start a new streak
    }

    streak.lastCompletedDate = todayStr;
    localStorage.setItem('streakData', JSON.stringify(streak));
    return streak.count;
};
