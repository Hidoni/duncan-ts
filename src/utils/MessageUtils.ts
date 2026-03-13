import { TextBasedChannel } from 'discord.js';

export async function* getAllMessagesInChannel(
    channel: TextBasedChannel,
    before?: string,
    after?: string
) {
    if (before != null && after != null) {
        throw new Error('before and after are mutually exclusive arguments!');
    }
    let messages = await channel.messages.fetch({
        limit: 100,
        before: before,
        after: after,
    });
    while (messages.size !== 0) {
        for (const [id, message] of messages) {
            yield message;
        }
        messages = await channel.messages.fetch({
            limit: 100,
            before: before != null ? messages.lastKey() : undefined,
            after: after != null ? messages.firstKey() : undefined,
        });
    }
}
