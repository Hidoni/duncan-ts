import { Question } from './models/Question';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export async function getUnusedQuestions(): Promise<Question[]> {
    return await Question.findAll({ where: { used: false } });
}

export async function insertQuestion(
    question: string,
    authorName: string
): Promise<void> {
    await Question.create({
        question: question,
        authorName: authorName,
        addedAt: new Date(),
    });
}

export async function getRandomQuestion() {
    const questions = await getUnusedQuestions();
    if (questions.length === 0) {
        return null;
    }

    const now = Date.now();
    const weights = questions.map((question) => {
        const daysSinceCreated =
            1 +
            Math.floor(
                (now - question.addedAt.getTime()) / MILLISECONDS_IN_DAY
            );
        return daysSinceCreated;
    });
    const totalWeight = weights.reduce((a, b) => a + b);
    let randomWeight = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
        if (randomWeight < weights[i]) {
            return questions[i];
        }
        randomWeight -= weights[i];
    }

    return null;
}
