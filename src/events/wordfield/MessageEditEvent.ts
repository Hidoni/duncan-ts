import { Message, TextChannel } from 'discord.js';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import {
    getEnabled,
    isMemberParticipatingInWordfield,
    checkForBannedWords,
} from '../../utils/WordfieldUtils';

export const name: string = 'messageUpdate';
export const handler: EventHandler = async (
    client: Bot,
    _oldMessage: Message,
    newMessage: Message
) => {
    if (newMessage.partial) {
        await newMessage.fetch();
    }
    if (
        newMessage.author.id !== client.user?.id &&
        newMessage.channel instanceof TextChannel &&
        newMessage.guildId
    ) {
        const guild = await client.guilds.fetch(newMessage.guildId);
        const member = await guild.members.fetch(newMessage.author);
        if (isMemberParticipatingInWordfield(member)) {
            await checkForBannedWords(client, newMessage, guild);
        }
    }
};
export const shouldLoad = getEnabled;
