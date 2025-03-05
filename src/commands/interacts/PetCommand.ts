import { CommandInteraction } from 'discord.js';
import { CountedInteractCommand } from './CountedInteractCommand';

const NEGATIVE_RESPONSES = [
    'Uhm.... ask furmission first! ;w;',
    'Did you... wash your pawbs?',
    '_runs away_',
    'There is still chip dust on your paws!!! -5 brownie points! {modifyBrowniePoints(delta=-5)}',
];
const POSITIVE_RESPONSES = [
    '<:blush:485895370526818305>',
    'uwu',
    'Am I a good sprinkledog?',
    "Did you know that playing with or petting an animal can increase levels of the stress-reducing hormone oxytocin and decrease production of the stress hormone cortisol? If you're stressed, feel free to pet me more!",
    'Awww! _pets back_',
    "Holy candy corn! You've pet me {count(delta=600, suffix=False)} times in the last 10 minutes!! Are you okay?",
    "Alright, since you've pet me {count(delta=*, suffix=False)} times, I'm starting to like you!",
    'More... more!!!!!!!',
    'Your paw fits so perfectly on my head!',
    'I can feel our friendship brownie points increasing! Great job!',
    'Is that maple syrup I smell on your pawbs? Yummers! +8 brownie points for you! {modifyBrowniePoints(delta=8)}',
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 1 / 100;

const NAME = 'pet';
const DESCRIPTION = 'You want to... pet me? >w<';

export const { builder, handler } = new CountedInteractCommand(
    NAME,
    DESCRIPTION,
    POSITIVE_RESPONSES,
    NEGATIVE_RESPONSES,
    CHANCE_FOR_NEGATIVE_RESPONSE
);

export const guildOnly = (interaction: CommandInteraction) => false;

export const permissions = (interaction: CommandInteraction) => false;

export const shouldLoad = () => true;
