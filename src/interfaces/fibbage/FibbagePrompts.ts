export type FibbagePrompts = {
    [prompt: string]: {
        question: string;
        answers: readonly [
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
