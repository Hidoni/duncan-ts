import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { generateQuestionModal, getEnabled } from '../../utils/FibbageUtils';

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
            `Could not find question ${questionId} for user ${interaction.user.id}`
        );
        await interaction.reply({
            content: `OnO, I'm sowwy, but I couldn't find your question, please let Hidoni know ASAP!!`,
        });
    } else {
        await interaction.showModal(
            generateQuestionModal(question.question, question.id)
        );
    }
};

export const pattern: RegExp = /^fibbage_question_button_(\d+)$/;

export const shoudLoad = () => getEnabled;
