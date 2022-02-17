import { APIInteractionGuildMember } from 'discord.js/node_modules/discord-api-types/payloads/v9/';
import {
    GuildMember,
    PermissionResolvable,
    Permissions,
    Snowflake,
} from 'discord.js';

const USERS_WITH_ADMIN_PERMISSIONS: Snowflake[] = [
    '87495537498021888',
    '381002402947399691',
];

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

export function isUserAdmin(id: Snowflake) {
    return USERS_WITH_ADMIN_PERMISSIONS.find((value) => value === id);
}
