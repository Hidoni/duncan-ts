export type FibbagePrompt = {
    [prompt: string]: {
        question: string;
        answer: readonly [
            string,
            string,
            string,
            string,
            string,
            string,
            string
        ];
    };
};
