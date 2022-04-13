import { ModalSubmitInteraction } from 'discord.js';
import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ModalHandlerFunction } from '../../interfaces/ModalHandler';
import { isFibbageOnBreak } from '../../utils/FibbageUtils';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

function getAnswerFromModal(interaction: ModalSubmitInteraction) {
    return interaction.fields
        .getTextInputValue('fibbage_question_input')
        .trim()
        .toUpperCase();
}

export const handler: ModalHandlerFunction = async (client, interaction) => {
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
            content:
                "OnO, I'm sowwy, but I can't find the question!! Please tell Hidoni ASAP!!",
        });
        return;
    }
    if (question.state != FibbageQuestionState.ASKED) {
        client.logger?.debug(
            `Question ${questionId} has already been asked, but an interaction for a truth submission was received`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                'Huh... the question has already been answered...? If you think this is wrong, tell Hidoni!',
        });
        return;
    }
    const answer = getAnswerFromModal(interaction);
    if (!answer) {
        await getSafeReplyFunction(
            client,
            interaction
        )({ content: 'You need to answer the question!' });
        return;
    }
    client.logger?.info(
        `User ${interaction.user.tag} answered question ${questionId}.`
    );
    question.state = FibbageQuestionState.ANSWERED;
    await question.save();
    await client.database.insertFibbageAnswer(
        answer,
        interaction.user.id,
        true,
        question
    );
    await client.database
        .getFibbageStats(interaction.user.id)
        .then(async (stats) => {
            stats.questionsSubmitted++;
            await stats.save();
        });
    await getSafeReplyFunction(
        client,
        interaction
    )({ content: "Thank you!! I'll go ask other players for some lies! >:3c" });
};

export const pattern: RegExp = /^fibbage_question_modal_(\d+)$/;

export const shoudLoad = () => true;
