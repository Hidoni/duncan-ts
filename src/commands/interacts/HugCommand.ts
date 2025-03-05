import { CommandInteraction } from 'discord.js';
import { CountedInteractCommand } from './CountedInteractCommand';

const NEGATIVE_RESPONSES = [
    "Ew... you're kinda stinky....",
    'Have you... taken a shower this week?',
    'Ack!! Too tight!!',
    '_hides_',
    "M-maybe we shouldn't, you could be sick!!",
    'Oh... no thank you. How about a pet instead?',
    '...When was the last time you showered? -8 brownie points. {modifyBrowniePoints(delta=-8)}',
    'Yay...! Hugs...!',
    'Okay, you can let me go now!',
];

const POSITIVE_RESPONSES = [
    'Awwww _hugs back_ uwu',
    'Oh gosh... for me?! Thank you! ^w^',
    'Wow, you seem a little stressed. You should keep hugging me!',
    'Nice and warm <3',
    "You've hugged me {count(delta=*, suffix=False)} times now, but is that the most out of everyone? Who knows!",
    "Hugging isn't a sport, but if it is, you would place in the upper bracket! +4 brownie points! {modifyBrowniePoints(delta=4)}",
    "Oops! Now you're covered in sprinkles! It's a great look though! +1 brownie point! {modifyBrowniePoints(delta=1)}",
    'You smell clean and nice! Thank you for taking care of your hygiene! +10 brownie points! {modifyBrowniePoints(delta=10)}',
    "Soffffft and flumffffyyyy... I'm talking about me, of course!",
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 1 / 69;

const NAME = 'hug';
const DESCRIPTION = 'You wanna hug me?!';

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
