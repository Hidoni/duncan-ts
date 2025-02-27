import { TextBasedChannel } from 'discord.js';

export async function* getAllMessagesInChannel(channel: TextBasedChannel, before?: string) {
    let messages = await channel.messages.fetch({ limit: 100, before: before });
    while (messages.size !== 0) {
        for (const [id, message] of messages) {
            yield message;
        }
        messages = await channel.messages.fetch({
            limit: 100,
            before: messages.lastKey(),
        });
    }
}
