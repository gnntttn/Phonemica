export const getTodayString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export const getFutureDateString = (daysToAdd: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
};
