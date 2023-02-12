import { ModalSubmitInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import { FibbageAnswer } from '../../database/models/FibbageAnswer';
import {
    FibbageQuestion,
    FibbageQuestionState,
} from '../../database/models/FibbageQuestion';
import { ModalHandlerFunction } from '../../interfaces/ModalHandler';
import { isFibbageOnBreak } from '../../utils/FibbageUtils';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

function getAnswerFromModal(interaction: ModalSubmitInteraction) {
    return interaction.fields
        .getTextInputValue('fibbage_prompt_input')
        .trim()
        .toUpperCase();
}

async function isQuestionStateValid(
    client: Bot,
    interaction: ModalSubmitInteraction,
    question: FibbageQuestion
): Promise<boolean> {
    if (question.state != FibbageQuestionState.PROMPTED) {
        client.logger?.debug(
            `Question ${question.id} has already been advanced past the PROMPTED stage (state: ${question.state}), but an interaction for a lie submission was received`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                'Huh... the question has already been used...? If you think this is wrong, tell Hidoni!',
        });
        return false;
    }
    const truth = question.answers.filter((question) => question.isCorrect)[0];
    if (!truth) {
        client.logger?.error(
            `Question ${question.id} has no correct answer, but user ${interaction.user.tag} submitted a lie for it.`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                'Uh oh, something is wrong with this question, please tell Hidoni ASAP!!',
        });
        return false;
    }
    return true;
}

async function isUserAnswerValid(
    client: Bot,
    interaction: ModalSubmitInteraction,
    question: FibbageQuestion,
    truth: FibbageAnswer
): Promise<boolean> {
    const userHasAlreadyAnswered = question.answers.some(
        (answer) => answer.user === interaction.user.id
    );
    if (userHasAlreadyAnswered) {
        client.logger?.debug(
            `User ${interaction.user.tag} has already answered question ${question.id}`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                "Nice try, but you can't submit more than one lie per question!!",
        });
        return false;
    }
    const answer = getAnswerFromModal(interaction);
    if (!answer) {
        await getSafeReplyFunction(
            client,
            interaction
        )({ content: 'You need to write a lie!' });
        return false;
    }
    if (answer === truth.answer) {
        client.logger?.debug(
            `User ${interaction.user.tag} submitted a lie for ${question.id} that was the correct answer`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                'Oh wow, you must know this person pretty well... your lie is too close to the truth!',
        });
        return false;
    }
    return true;
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
        Number.parseInt(questionId),
        { loadAnswers: true }
    );
    if (!question) {
        client.logger?.error(
            `Could not find question ${questionId} despite user ${interaction.user.tag} submitting a lie for it.`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content:
                "OnO, I'm sowwy, but I can't find that question!! Please tell Hidoni ASAP!!",
        });
        return;
    }
    if (!(await isQuestionStateValid(client, interaction, question))) {
        return;
    }
    const truth = question.answers.filter((question) => question.isCorrect)[0];
    if (!(await isUserAnswerValid(client, interaction, question, truth))) {
        return;
    }
    client.logger?.info(
        `User ${interaction.user.tag} submitted a lie for question ${questionId}.`
    );
    await client.database.insertFibbageAnswer(
        getAnswerFromModal(interaction),
        interaction.user.id,
        false,
        question
    );
    await client.database
        .getFibbageStats(interaction.user.id)
        .then(async (stats) => {
            stats.liesSubmitted++;
            await stats.save();
        });
    await getSafeReplyFunction(
        client,
        interaction
    )({ content: "Thank you!! I'm sure this will fool someone! >:3c" });
};

export const pattern: RegExp = /^fibbage_prompt_modal_(\d+)$/;

export const shouldLoad = () => true;
