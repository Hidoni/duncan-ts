import { Guild, Message, TextChannel } from 'discord.js';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import {
    getBannedWordsRegex,
    getEnabled,
    getIgnoredChannelsList,
    isMemberParticipatingInWordfield,
} from '../../utils/WordfieldUtils';
import { getUserPreferredName } from '../../utils/InteractionUtils';

async function checkForBannedWords(
    client: Bot,
    message: Message,
    guild: Guild
) {
    const regex = getBannedWordsRegex();
    const matches = regex.exec(message.content.toLowerCase());
    if (matches) {
        client.logger?.info(
            `Got match for regex on message from ${message.author.username}: ${matches} (From original message: "${message.content}")`
        );
        await message.reply(
            `OOOOOOHH! ${await getUserPreferredName(
                client,
                message.author.id,
                guild
            )} said one of the banned words, "${
                matches[0]
            }"! I gotta tell <@381002402947399691> about this!`
        );
    }
}

export const name: string = 'messageCreate';
export const handler: EventHandler = async (client: Bot, message: Message) => {
    if (
        message.author.id !== client.user?.id &&
        message.channel instanceof TextChannel &&
        message.guildId
    ) {
        const guild = await client.guilds.fetch(message.guildId);
        const member = await guild.members.fetch(message.author);
        if (isMemberParticipatingInWordfield(member)) {
            await checkForBannedWords(client, message, guild);
            if (
                !getIgnoredChannelsList().find(
                    (value) => value == message.channelId
                )
            ) {
                await client.database.incrementMessageCount(message.author.id);
            }
        }
    }
};
export const shouldLoad = getEnabled;
