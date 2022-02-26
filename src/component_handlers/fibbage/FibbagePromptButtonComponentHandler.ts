import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { generatePromptModal, getEnabled } from '../../utils/FibbageUtils';

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
            `Could not find question ${questionId} despite user ${interaction.user.tag} trying to submit a lie for it.`
        );
        await interaction.reply({
            content: `OnO, I'm sowwy, but I couldn't find that question, please let Hidoni know ASAP!!`,
        });
    } else if (question.state != FibbageQuestionState.PROMPTED) {
        client.logger?.debug(
            `Question ${questionId} has advanced past the PROMPTED state, preventing a new lie from being submitted (State is ${question.state})`
        );
        await interaction.reply(
            "Sorry, but I can't accept lies for this question anymore!"
        );
    } else {
        await interaction.showModal(generatePromptModal(question.id));
    }
};

export const pattern: RegExp = /^fibbage_prompt_button_(\d+)$/;

export const shoudLoad = () => getEnabled;
