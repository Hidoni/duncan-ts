import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { getEnabled, groupIdenticalAnswers } from '../../utils/FibbageUtils';

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    const idInfo = interaction.customId.match(pattern);
    const questionId = idInfo![1];
    const answerPosition = Number.parseInt(idInfo![2]);
    const question = await client.database.getFibbageQuestion(
        Number.parseInt(questionId),
        { loadAnswers: true, loadGuesses: true }
    );
    if (!question) {
        client.logger?.error(
            `Could not find question ${questionId} for interaction from user ${interaction.user.tag} (customId: ${interaction.customId})`
        );
        await interaction.reply({
            content: `OnO, I'm sowwy, but I couldn't find the question, please let Hidoni know ASAP!!`,
            ephemeral: true,
        });
        return;
    }
    if (question.state !== FibbageQuestionState.IN_USE) {
        client.logger?.debug(
            `Question ${question.id} has advanced past the IN_USE state, preventing a new guess for answer in position ${answerPosition} from being submitted (State is ${question.state})`
        );
        await interaction.reply({
            content:
                "Sorry, but I can't accept guesses for this question anymore!",
            ephemeral: true,
        });
        return;
    }
    if (
        question.answers.some((a) =>
            a.guesses.some((g) => g.user === interaction.user.id)
        )
    ) {
        client.logger?.debug(
            `User ${interaction.user.tag} has already guessed an answer for question ${question.id}, preventing another guess`
        );
        await interaction.reply({
            content: `You've already guessed an answer for this question!`,
            ephemeral: true,
        });
        return;
    }
    if (question.user === interaction.user.id) {
        client.logger?.debug(
            `Preventing user ${interaction.user.tag} from guessing on their own question`
        );
        await interaction.reply({
            content: `Nice try, but you can't guess on your own question!`,
            ephemeral: true,
        });
        return;
    }
    const answerGroup = groupIdenticalAnswers(question.answers).find((g) =>
        g.some((a) => a.answerPosition === answerPosition)
    );
    if (!answerGroup) {
        client.logger?.debug(
            `Could not find an answer group for answer in position ${answerPosition} for question ${question.id}`
        );
        await interaction.reply({
            content: `I'm sowwy, but I couldn't find the answer, please let Hidoni know ASAP!!`,
            ephemeral: true,
        });
        return;
    }
    if (answerGroup.some((answer) => answer.user === interaction.user.id)) {
        client.logger?.debug(
            `Preventing user ${interaction.user.tag} from guessing on their own answer`
        );
        await interaction.reply({
            content: `Nuh-uh, you can't guess your own answer!`,
            ephemeral: true,
        });
        return;
    }
    client.logger?.info(
        `Saving user ${interaction.user.tag} guess for answer in position ${answerPosition} for question ${question.id}`
    );
    for (const answer of answerGroup) {
        await client.database.insertFibbageGuess(interaction.user.id, answer);
    }
    await client.database
        .getFibbageStats(interaction.user.id)
        .then(async (stats) => {
            stats.timesGuessed++;
            await stats.save();
        });
    await interaction.reply({
        content: `Your answer has been recorded, please wait until I reveal the results!`,
        ephemeral: true,
    });
};

export const pattern: RegExp = /^fibbage_answer_button_(\d+)_(\d+)$/;

export const shoudLoad = () => getEnabled;
