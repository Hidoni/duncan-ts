export type FibbagePrompt = {
    question: string;
    answers: readonly [string, string, string, string, string, string, string];
};

export type FibbagePrompts = {
    [prompt: string]: FibbagePrompt;
};
