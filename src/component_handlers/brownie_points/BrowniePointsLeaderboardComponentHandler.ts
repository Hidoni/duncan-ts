import { MessageComponentInteraction } from 'discord.js';
import {
    leaderboardEmbedAttributes,
    leaderboardMappingFunction,
} from '../../commands/brownie_points/BrowniePointsCommands';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import {
    generateLeaderboardComponentsRow,
    generateLeaderboardEmbed,
} from '../../utils/LeaderboardUtils';
import { BrowniePoints } from '../../database/models/BrowniePoints';

async function updateMessageLeaderboard(
    points: BrowniePoints[],
    page: number,
    interaction: MessageComponentInteraction
): Promise<void> {
    const embed = generateLeaderboardEmbed(
        points,
        leaderboardMappingFunction,
        page,
        leaderboardEmbedAttributes
    );
    const pageControlRow = generateLeaderboardComponentsRow(
        points,
        page,
        `brownie_points_leaderboard_${interaction.user.id}`
    );
    await interaction.update({ embeds: [embed], components: [pageControlRow] });
}

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    const idInfo = interaction.customId.match(pattern);
    const userId = idInfo![1];
    if (userId !== interaction.user.id) {
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `OnO, I'm sowwy, but this isn't your leaderboard!! Only <@${userId}> can switch pages on this one!!`,
            ephemeral: true,
        });
    } else {
        const points = await client.database.getAllBrowniePoints();
        const page = idInfo![2];
        switch (page) {
            case 'FIRST':
                await updateMessageLeaderboard(points, 1, interaction);
                break;
            case 'LAST':
                await updateMessageLeaderboard(
                    points,
                    Math.ceil(points.length / 10),
                    interaction
                );
                break;
            default:
                await updateMessageLeaderboard(
                    points,
                    Number.parseInt(page),
                    interaction
                );
                break;
        }
    }
};

export const pattern: RegExp =
    /^brownie_points_leaderboard_(\d+)_((?:FIRST|LAST)|(?:\d+))$/;

export const shouldLoad = () => true;
