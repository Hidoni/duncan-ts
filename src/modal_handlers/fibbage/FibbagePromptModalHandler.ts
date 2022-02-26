import { ModalSubmitInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import { FibbageAnswer } from '../../database/models/FibbageAnswer';
import {
    FibbageQuestion,
    FibbageQuestionState,
} from '../../database/models/FibbageQuestion';
import { ModalHandlerFunction } from '../../interfaces/ModalHandler';

function getAnswerFromModal(interaction: ModalSubmitInteraction) {
    return interaction.fields
        .getTextInputValue('fibbage_prompt_input')
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
        await interaction.reply(
            'Huh... the question has already been used...? If you think this is wrong, tell Hidoni!'
        );
        return false;
    }
    const truth = question.answers.filter((question) => question.isCorrect)[0];
    if (!truth) {
        client.logger?.error(
            `Question ${question.id} has no correct answer, but user ${interaction.user.tag} submitted a lie for it.`
        );
        await interaction.reply(
            'Uh oh, something is wrong with this question, please tell Hidoni ASAP!!'
        );
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
        await interaction.reply(
            "Nice try, but you can't submit more than one lie per question!!"
        );
        return false;
    }
    const answer = getAnswerFromModal(interaction);
    if (!answer) {
        await interaction.reply('You need to write a lie!');
        return false;
    }
    if (answer === truth.answer) {
        client.logger?.debug(
            `User ${interaction.user.tag} submitted a lie for ${question.id} that was the correct answer`
        );
        await interaction.reply(
            'Oh wow, you must know this person pretty well... your lie is too close to the truth!'
        );
        return false;
    }
    return true;
}

export const handler: ModalHandlerFunction = async (client, interaction) => {
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
        await interaction.reply(
            "OnO, I'm sowwy, but I can't find that question!! Please tell Hidoni ASAP!!"
        );
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
    await interaction.reply(
        "Thank you!! I'm sure this will fool someone! >:3c"
    );
};

export const pattern: RegExp = /^fibbage_prompt_modal_(\d+)$/;

export const shoudLoad = () => true;
