import Conf from 'conf';

const config = new Conf();

export function getDays(): number {
    const days = config.get('qotd.days');
    return typeof days === 'number' ? days : 0;
}

export function setDays(days: number) {
    config.set('qotd.days', days);
}

export function getChannel(): string {
    const channel = config.get('qotd.channel');
    return typeof channel === 'string' ? channel : '0';
}

export function setChannel(channel: string) {
    config.set('qotd.channel', channel);
}
