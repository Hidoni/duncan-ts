import {
    CategoryChannel,
    GuildTextBasedChannel,
    Message,
    TextChannel,
    ThreadChannel,
} from 'discord.js';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';

const GIMMICKS_CATEGORY_ID = '789272443104788530';

function getCategory(channel: GuildTextBasedChannel): CategoryChannel | null {
    const category = channel.parent;
    if (!category) {
        return null;
    }
    if (category instanceof CategoryChannel) {
        return category;
    }
    return getCategory(category);
}

async function giveGimmickPoints(client: Bot, message: Message) {
    if (
        message.channel instanceof TextChannel ||
        message.channel instanceof ThreadChannel
    ) {
        const category = getCategory(message.channel);
        if (category) {
            if (category.id === GIMMICKS_CATEGORY_ID) {
                await client.database
                    .getGimmickPoints(message.author.id)
                    .then((points) => {
                        points.points++;
                        points.save();
                    });
            }
        }
    }
}

export const name: string = 'messageCreate';
export const handler: EventHandler = async (client: Bot, message: Message) => {
    if (message.author.id !== client.user?.id) {
        await giveGimmickPoints(client, message);
    }
};
