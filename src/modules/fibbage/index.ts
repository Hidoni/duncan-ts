import { Module } from '../../interfaces/Module';
import * as FibbageCommand from './commands/FibbageCommand';
import * as FibbageAnswerButtonComponentHandler from './component_handlers/FibbageAnswerButtonComponentHandler';
import * as FibbageDetailedResultsButtonComponentHandler from './component_handlers/FibbageDetailedResultsButtonComponentHandler';
import * as FibbagePromptButtonComponentHandler from './component_handlers/FibbagePromptButtonComponentHandler';
import * as FibbageQuestionButtonComponentHandler from './component_handlers/FibbageQuestionButtonComponentHandler';
import * as FibbageSkipButtonComponentHandler from './component_handlers/FibbageSkipButtonComponentHandler';
import * as FibbageJob from './jobs/FibbageJob';
import * as FibbagePromptModalHandler from './modal_handlers/FibbagePromptModalHandler';
import * as FibbageQuestionModalHandler from './modal_handlers/FibbageQuestionModalHandler';
import { FibbageAnswer } from './models/FibbageAnswer';
import { FibbageCustomPrompt } from './models/FibbageCustomPrompt';
import { FibbageCustomPromptApproval } from './models/FibbageCustomPromptApproval';
import { FibbageCustomPromptDefaultAnswer } from './models/FibbageCustomPromptDefaultAnswer';
import { FibbageGuess } from './models/FibbageGuess';
import { FibbageQuestion } from './models/FibbageQuestion';
import { FibbageStats } from './models/FibbageStats';

const fibbageModule: Module = {
    name: 'fibbage',
    commands: [FibbageCommand],
    jobs: [FibbageJob],
    componentHandlers: [
        FibbageAnswerButtonComponentHandler,
        FibbageDetailedResultsButtonComponentHandler,
        FibbageCommand.leaderboard.componentHandler,
        FibbagePromptButtonComponentHandler,
        FibbageQuestionButtonComponentHandler,
        FibbageSkipButtonComponentHandler,
    ],
    modalHandlers: [FibbagePromptModalHandler, FibbageQuestionModalHandler],
    models: [
        FibbageAnswer,
        FibbageCustomPrompt,
        FibbageCustomPromptApproval,
        FibbageCustomPromptDefaultAnswer,
        FibbageGuess,
        FibbageQuestion,
        FibbageStats,
    ],
};

export default fibbageModule;
