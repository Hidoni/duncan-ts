export type FibbageDefaultAnswers = readonly [string, string, string, string, string, string, string];

export type FibbagePrompt = {
    prompt: string;
    answers: FibbageDefaultAnswers;
};

export type FibbagePrompts = {
    [question: string]: FibbagePrompt;
};
