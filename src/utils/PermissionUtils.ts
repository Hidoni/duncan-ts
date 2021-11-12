import { APIInteractionGuildMember } from 'discord.js/node_modules/discord-api-types';
import { GuildMember, PermissionResolvable, Permissions } from 'discord.js';

export function hasPermissions(
    member: GuildMember | APIInteractionGuildMember,
    permissions: PermissionResolvable,
    checkAdmin?: boolean
): boolean {
    if (member instanceof GuildMember) {
        return member.permissions.has(permissions, checkAdmin);
    }
    const userPermissions = BigInt(member.permissions);
    return new Permissions(userPermissions).has(permissions, checkAdmin);
}
