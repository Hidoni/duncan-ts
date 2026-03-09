const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function midnightUTCDateForDate(date: Date): Date {
    return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
}

export function utcToday(): Date {
    const now = new Date();
    return midnightUTCDateForDate(now);
}

export function addDaysToDate(date: Date, days: number): Date {
    return new Date(date.getTime() + days * DAY_IN_MILLISECONDS);
}

export function dateToSnowflake(date: Date): string {
    const timestamp = BigInt(date.getTime());
    const discordEpoch = BigInt(1420070400000);
    const snowflake = (timestamp - discordEpoch) << BigInt(22);
    return snowflake.toString();
}

export function daysBetweenDates(first: Date, second: Date): number {
    const firstMidnight = midnightUTCDateForDate(first);
    const secondMidnight = midnightUTCDateForDate(second);
    const diffInMs = Math.abs(firstMidnight.getTime() - secondMidnight.getTime());
    return Math.floor(diffInMs / DAY_IN_MILLISECONDS);
}