import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import {
    isFibbageOnBreak,
    generatePromptModal,
    getEnabled,
} from '../../utils/FibbageUtils';
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
        Number.parseInt(questionId),
        { loadAnswers: true }
    );
    if (!question) {
        client.logger?.error(
            `Could not find question ${questionId} despite user ${interaction.user.tag} trying to submit a lie for it.`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `OnO, I'm sowwy, but I couldn't find that question, please let Hidoni know ASAP!!`,
        });
    } else if (question.state != FibbageQuestionState.PROMPTED) {
        client.logger?.debug(
            `Question ${questionId} has advanced past the PROMPTED state, preventing a new lie from being submitted (State is ${question.state})`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                "Sorry, but I can't accept lies for this question anymore!",
        });
    } else if (
        question.answers.some((answer) => answer.user === interaction.user.id)
    ) {
        client.logger?.debug(
            `User ${interaction.user.tag} has already answered question ${question.id}, not showing prompt modal again.`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                "Nice try, but you can't submit more than one lie per question!!",
        });
    } else {
        await interaction.showModal(generatePromptModal(question.id));
    }
};

export const pattern: RegExp = /^fibbage_prompt_button_(\d+)$/;

export const shoudLoad = () => getEnabled;
