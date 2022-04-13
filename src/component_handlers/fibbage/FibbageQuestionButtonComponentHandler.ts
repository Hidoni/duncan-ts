import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { isFibbageOnBreak, generateQuestionModal, getEnabled } from '../../utils/FibbageUtils';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    if (isFibbageOnBreak()) {
        client.logger?.debug(
            `Fibbage is on break, ignoring interaction ${interaction.id} from ${interaction.user.tag} (customId: ${interaction.customId})`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `Fibbage is currently on break! You can still view leaderboards and stats, but you can't engage with new questions!`,
        });
        return;
    }
    
    const idInfo = interaction.customId.match(pattern);
    const questionId = idInfo![1];
    const question = await client.database.getFibbageQuestion(
        Number.parseInt(questionId)
    );
    if (!question) {
        client.logger?.error(
            `Could not find question ${questionId} for user ${interaction.user.tag}`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `OnO, I'm sowwy, but I couldn't find your question, please let Hidoni know ASAP!!`,
        });
    } else if (question.state != FibbageQuestionState.ASKED) {
        client.logger?.debug(
            `Question ${questionId} has already been answered, preventing a new answer from being submitted (State is ${question.state})`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({ content: "Nice try, but you've already answered this question!" });
    } else {
        await interaction.showModal(generateQuestionModal(question.id));
    }
};

export const pattern: RegExp = /^fibbage_question_button_(\d+)$/;

export const shoudLoad = () => getEnabled;
