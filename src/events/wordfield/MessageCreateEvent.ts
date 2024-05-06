import { Message, TextChannel } from 'discord.js';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import {
    getEnabled,
    getIgnoredChannelsList,
    isMemberParticipatingInWordfield,
    checkForBannedWords,
} from '../../utils/WordfieldUtils';

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
