import Conf from 'conf';

const config = new Conf();

export function getInteractionCountMigrationGuild(): string | null {
    const guild = config.get('migration.interaction_count.guild');
    return typeof guild === 'string' ? guild : null;
}
