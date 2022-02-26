import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import {
    generateQuestionModal,
    getEnabled,
    promptUserWithQuestion,
} from '../../utils/FibbageUtils';

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    const idInfo = interaction.customId.match(pattern);
    const questionId = idInfo![1];
    const question = await client.database.getFibbageQuestion(
        Number.parseInt(questionId)
    );
    if (!question) {
        client.logger?.error(
            `Could not find question ${questionId} for user ${interaction.user.tag}`
        );
        await interaction.reply({
            content: `OnO, I'm sowwy, but I couldn't find your question, please let Hidoni know ASAP!!`,
        });
    } else if (question.state != FibbageQuestionState.ASKED) {
        client.logger?.debug(
            `Question ${questionId} has already been answered, preventing skip button (State is ${question.state})`
        );
        await interaction.reply(
            "Nice try, but you've already answered this question, so no skipping now!"
        );
    } else {
        question.state = FibbageQuestionState.SKIPPED;
        await question.save();
        const askedQuestions = await client.database.getAllFibbageQuestions();
        await interaction.reply('Oki! Lemme get you a new question...');
        await promptUserWithQuestion(client, interaction.user, askedQuestions);
    }
};

export const pattern: RegExp = /^fibbage_question_skip_(\d+)$/;

export const shoudLoad = () => getEnabled;
