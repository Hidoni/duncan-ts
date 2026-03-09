import { ModalSubmitInteraction } from 'discord.js';
import { ModalHandlerFunction } from '../../interfaces/ModalHandler';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import {
    getEnabled,
    MapTapInvalidScoreDateError,
    MapTapParseError,
    ParsedMapTapScore,
    parseMapTapScoreForManualSubmission,
} from '../../utils/MapTapUtils';

function getRawScoreFromModal(interaction: ModalSubmitInteraction): string {
    return interaction.fields.getTextInputValue('score');
}

function getScoreFromModal(
    interaction: ModalSubmitInteraction
): ParsedMapTapScore {
    const rawScore = getRawScoreFromModal(interaction);
    return parseMapTapScoreForManualSubmission(rawScore);
}

export const handler: ModalHandlerFunction = async (client, interaction) => {
    let parsedScore = null;
    try {
        parsedScore = getScoreFromModal(interaction);
    } catch (error) {
        if (error instanceof MapTapParseError) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content:
                    "Huh?? I couldn't understand that score! Make sure you copy-pasted it correctly from maptap.gg!",
                ephemeral: true,
            });
            return;
        } else if (error instanceof MapTapInvalidScoreDateError) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content:
                    'That score is either too old or from the future! I can only accept scores from within 48 hours from the current date!',
                ephemeral: true,
            });
            return;
        }
        throw error;
    }
    try {
        const score = await client.database.insertMapTapScore(
            interaction.user.id,
            parsedScore.date,
            parsedScore.firstRound,
            parsedScore.secondRound,
            parsedScore.thirdRound,
            parsedScore.fourthRound,
            parsedScore.fifthRound
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `Thanks for submitting your score of ${score.getFinalScore()} points for ${score.date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}!`,
            ephemeral: true,
        });
    } catch (error) {
        if (
            error instanceof Error &&
            error.name === 'SequelizeUniqueConstraintError'
        ) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content:
                    "Looks like you've already submitted a score for that date!!",
                ephemeral: true,
            });
        }
    }
};

export const pattern: RegExp = /^map_tap_submit_modal$/;

export const shouldLoad = getEnabled;
