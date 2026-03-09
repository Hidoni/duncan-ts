import { MessageComponentInteraction } from 'discord.js';
import { MapTapScore } from '../../database/models/MapTapScore';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import {
    generateLeaderboardEmbed,
    generateLeaderboardComponentsRow,
} from '../../utils/LeaderboardUtils';
import { getTotalScoresMap } from '../../utils/MapTapUtils';
import {
    leaderboardEmbedAttributes,
    leaderboardMappingFunction,
} from '../../commands/maptap/MapTapCommand';

async function updateMessageLeaderboard(
    scores: MapTapScore[],
    page: number,
    interaction: MessageComponentInteraction
): Promise<void> {
    const totalScores = getTotalScoresMap(scores);
    const embed = generateLeaderboardEmbed(
        Array.from(totalScores.entries()),
        leaderboardMappingFunction,
        page,
        leaderboardEmbedAttributes
    );
    const pageControlRow = generateLeaderboardComponentsRow(
        Array.from(totalScores.entries()),
        page,
        `map_tap_scores_leaderboard_${interaction.user.id}`
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
        const scores = await client.database.getAllMapTapScores();
        const page = idInfo![2];
        switch (page) {
            case 'FIRST':
                await updateMessageLeaderboard(scores, 1, interaction);
                break;
            case 'LAST':
                await updateMessageLeaderboard(
                    scores,
                    Math.ceil(scores.length / 10),
                    interaction
                );
                break;
            default:
                await updateMessageLeaderboard(
                    scores,
                    Number.parseInt(page),
                    interaction
                );
                break;
        }
    }
};

export const pattern: RegExp =
    /^map_tap_scores_leaderboard_(\d+)_((?:FIRST|LAST)|(?:\d+))$/;

export const shouldLoad = () => true;
