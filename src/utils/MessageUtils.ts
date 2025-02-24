import { TextBasedChannel } from 'discord.js';

export async function* getAllMessagesInChannel(channel: TextBasedChannel) {
    let messages = await channel.messages.fetch({ limit: 100 });
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
