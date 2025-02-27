import Conf from 'conf';

const config = new Conf();

export function getInteractionCountMigrationGuild(): string | null {
    const guild = config.get('migration.interaction_count.guild');
    return typeof guild === 'string' ? guild : null;
}

export function setInteractionCountMigrationLastMessageMap(
    map: Map<string, string>
) {
    config.set(
        'migration.interaction_count.last_message',
        Object.fromEntries(map)
    );
}

export function getInteractionCountMigrationLastMessageMap(): Map<
    string,
    string
> {
    const map = config.get('migration.interaction_count.last_message');
    return map && typeof map === 'object'
        ? new Map(Object.entries(map))
        : new Map();
}
