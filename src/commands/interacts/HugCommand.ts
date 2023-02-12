import { CommandInteraction } from 'discord.js';
import { InteractCommand } from './InteractCommand';

const NEGATIVE_RESPONSES = [
    "Ew... you're kinda stinky....",
    'Have you... taken a shower this week?',
    'Ack!! Too tight!!',
    '_hides_',
    "M-maybe we shouldn't, you could be sick!!",
    'Oh... no thank you. How about a pet instead?',
];

const POSITIVE_RESPONSES = [
    '<a:hugAttack:1074424007694241823>',
    'Awwww _hugs back_ uwu',
    'Oh gosh... for me?! Thank you! ^w^',
    'Wow, you seem a little stressed. You should keep hugging me!',
    // 'Is that a banana in your pocket or are you just excited to see me?',
    'Nice and warm <3',
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 1 / 69;

const NAME = 'hug';
const DESCRIPTION = 'You wanna hug me?!';

export const { builder, handler } = new InteractCommand(
    NAME,
    DESCRIPTION,
    POSITIVE_RESPONSES,
    NEGATIVE_RESPONSES,
    CHANCE_FOR_NEGATIVE_RESPONSE
);

export const guildOnly = (interaction: CommandInteraction) => false;

export const permissions = (interaction: CommandInteraction) => false;

export const shouldLoad = () => true;
