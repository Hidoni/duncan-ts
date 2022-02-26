import { FibbageQuestionState } from '../../database/models/FibbageQuestion';
import { ComponentHandlerFunction } from '../../interfaces/ComponentHandler';
import { getEnabled } from '../../utils/FibbageUtils';

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {
    const idInfo = interaction.customId.match(pattern);
    const answerId = idInfo![1];
    const answer = await client.database.getFibbageAnswer(
        Number.parseInt(answerId),
        { loadQuestion: true, loadAnswers: true, loadGuesses: true }
    );
    if (!answer) {
        client.logger?.error(
            `Could not find answer ${answerId} for interaction from user ${interaction.user.tag}`
        );
        await interaction.reply({
            content: `OnO, I'm sowwy, but I couldn't find your question, please let Hidoni know ASAP!!`,
            ephemeral: true,
        });
        return;
    }
    if (answer.question.state !== FibbageQuestionState.IN_USE) {
        client.logger?.debug(
            `Question ${answer.question.id} has advanced past the IN_USE state, preventing a new guess for answer ${answer.id} from being submitted (State is ${answer.question.state})`
        );
        await interaction.reply({
            content:
                "Sorry, but I can't accept guesses for this question anymore!",
            ephemeral: true,
        });
        return;
    }
    if (
        answer.question.answers.some((a) =>
            a.guesses.some((g) => g.user === interaction.user.id)
        )
    ) {
        client.logger?.debug(
            `User ${interaction.user.tag} has already guessed an answer for question ${answer.question.id}, preventing another guess`
        );
        await interaction.reply({
            content: `You've already guessed an answer for this question!`,
            ephemeral: true,
        });
        return;
    }
    if (answer.question.user === interaction.user.id) {
        client.logger?.debug(
            `Preventing user ${interaction.user.tag} from guessing on their own question`
        );
        await interaction.reply({
            content: `Nice try, but you can't guess on your own question!`,
            ephemeral: true,
        });
        return;
    }
    if (answer.user === interaction.user.id) {
        client.logger?.debug(
            `Preventing user ${interaction.user.tag} from guessing on their own answer`
        );
        await interaction.reply({
            content: `Nuh-uh, you can't guess your own answer!`,
            ephemeral: true,
        });
        return;
    }
    await client.database.insertFibbageGuess(interaction.user.id, answer);
    await interaction.reply({
        content: `Your answer has been recorded, please wait until I reveal the results!`,
        ephemeral: true,
    });
};

export const pattern: RegExp = /^fibbage_answer_button_(\d+)$/;

export const shoudLoad = () => getEnabled;
