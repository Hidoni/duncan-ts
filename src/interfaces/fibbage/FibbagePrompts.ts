export type FibbagePrompt = {
    prompt: string;
    answers: readonly [string, string, string, string, string, string, string];
};

export type FibbagePrompts = {
    [question: string]: FibbagePrompt;
};
