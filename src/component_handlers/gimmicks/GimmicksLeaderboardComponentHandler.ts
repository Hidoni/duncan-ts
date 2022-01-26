import { MessageComponentInteraction } from 'discord.js';
import {
    leaderboardEmbedAttributes,
    leaderboardMappingFunction,
} from '../../commands/gimmicks/GimmicksCommand';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { GimmickPointsInstance } from '../../interfaces/gimmicks/GimmickPoints';
import {
    generateLeaderboardComponentsRow,
    generateLeaderboardEmbed,
} from '../../utils/LeaderboardUtils';

async function updateMessageLeaderboard(
    points: GimmickPointsInstance[],
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
        `gimmicks_leaderboard_${interaction.user.id}`
    );
    interaction.update({ embeds: [embed], components: [pageControlRow] });
}

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    const idInfo = interaction.customId.match(pattern);
    const userId = idInfo![1];
    if (userId !== interaction.user.id) {
        await interaction.reply({
            content: `OnO, I'm sowwy but this isn't your leaderboard, only <@${userId}> can switch pages on this one!!`,
            ephemeral: true,
        });
    } else {
        const points = await client.database.getAllGimmickPoints();
        const page = idInfo![2];
        switch (page) {
            case 'FIRST':
                updateMessageLeaderboard(points, 1, interaction);
                break;
            case 'LAST':
                updateMessageLeaderboard(
                    points,
                    Math.ceil(points.length / 10),
                    interaction
                );
                break;
            default:
                updateMessageLeaderboard(
                    points,
                    Number.parseInt(page),
                    interaction
                );
                break;
        }
    }
};

export const pattern: RegExp =
    /^gimmicks_leaderboard_(\d+)_((?:FIRST|LAST)|(?:\d+))$/;
