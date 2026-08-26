import { Guild, Snowflake } from 'discord.js';
import { getName } from './NameQueries';

export async function getUserPreferredName(user: Snowflake, guild: Guild) {
    const name = await getName(user);
    if (name) {
        return name;
    }
    const guildUser = await guild.members.fetch(user);
    const nickname = guildUser.nickname;
    if (nickname) {
        return nickname;
    }
    return guildUser.displayName;
}
