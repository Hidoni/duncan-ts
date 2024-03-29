import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import {
    generateDetailedQuestionReport,
    getEnabled,
} from '../../utils/FibbageUtils';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    const idInfo = interaction.customId.match(pattern);
    const questionId = idInfo![1];
    const question = await client.database.getFibbageQuestion(
        Number.parseInt(questionId),
        { loadAnswers: true, loadGuesses: true }
    );
    if (!question) {
        client.logger?.error(
            `Could not find question ${questionId} despite user ${interaction.user.tag} trying to access its detailed results.`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `OnO, I'm sowwy, but I couldn't find that question, please let Hidoni know ASAP!!`,
        });
    } else if (question.state != FibbageQuestionState.DONE) {
        client.logger?.debug(
            `Question ${questionId} is not in DONE state, not showing results. (State is ${question.state})`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                "Sorry, but this question doesn't seem to be finished yet!",
            ephemeral: true,
        });
    } else {
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: generateDetailedQuestionReport(client, question),
            ephemeral: true,
        });
    }
};

export const pattern: RegExp = /^fibbage_detailed_results_(\d+)$/;

export const shouldLoad = () => getEnabled;
