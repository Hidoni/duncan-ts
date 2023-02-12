import { CommandInteraction } from 'discord.js';
import { InteractCommand } from './InteractCommand';

const NEGATIVE_RESPONSES = [
    'Uhm.... ask furmission first! ;w;',
    'Did you... wash your pawbs?',
    '_runs away_',
];
const POSITIVE_RESPONSES = [
    '<:blush:485895370526818305>',
    'uwu',
    'Am I a good sprinkledog?',
    "Did you know that playing with or petting an animal can increase levels of the stress-reducing hormone oxytocin and decrease production of the stress hormone cortisol? If you're stressed, feel free to pet me more!",
    'Awww! _pets back_',
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 1 / 100;

const NAME = 'pet';
const DESCRIPTION = 'You want to... pet me? >w<';

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
