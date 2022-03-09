import { getLeaderboardFromSubcommand } from '../../commands/fibbage/FibbageCommand';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

function getValidPageValue(page: string): number | 'FIRST' | 'LAST' | null {
    if (page !== 'FIRST' && page !== 'LAST') {
        const pageNumber = parseInt(page);
        if (isNaN(pageNumber)) {
            return null;
        }
        return pageNumber;
    }
    return page;
}

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    const idInfo = interaction.customId.match(pattern);
    const subCommand = idInfo![1];
    const userId = idInfo![2];
    if (userId !== interaction.user.id) {
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `OnO, I'm sowwy, but this isn't your leaderboard!! Only <@${userId}> can switch pages on this one!!`,
            ephemeral: true,
        });
        return;
    }
    const page = getValidPageValue(idInfo![3]);
    if (page === null) {
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `OnO, I'm sowwy, but I got an invalid page number, please tell Hidoni!!`,
            ephemeral: true,
        });
        client.logger?.error(`Invalid page number: ${idInfo![3]}`);
        return;
    }
    const { leaderboardembed, outputActionRows } =
        await getLeaderboardFromSubcommand(client, subCommand, userId, page);
    client.logger?.debug(
        `Generated ${subCommand} leaderboard (page ${page}) for ${interaction.user.tag}`
    );
    await getSafeReplyFunction(
        client,
        interaction
    )({
        embeds: [leaderboardembed],
        components: outputActionRows,
        ephemeral: false,
    });
};

export const pattern: RegExp =
    /^fibbage_leaderboard_(?:switcher_)?(.+)_(\d+)_((?:FIRST|LAST)|(?:\d+))$/;

export const shoudLoad = () => true;
