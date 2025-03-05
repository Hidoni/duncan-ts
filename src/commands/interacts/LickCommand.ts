import { CommandInteraction } from 'discord.js';
import { CountedInteractCommand } from './CountedInteractCommand';

const NEGATIVE_RESPONSES = [
    'Omg that is SO gross!',
    'What the HECK!!',
    "What part of **NOT EDIBLE** didn't you understand?!",
    'Ew... ew ew ew ew EW!',
    "_sigh_ aren't you tired of this already?",
    'Thanks... I guess?',
    "Please don't! >w<",
    'Get AWAY from me with that tongue!!',
    'H..how about we just stick to pets for now...',
    "Eughhhh now I have to wash my face because of YOU! -15 brownie points! {modifyBrowniePoints(delta=-15)}",
    "NOOO don't lick me here! -40 brownie points! {modifyBrowniePoints(delta=-40)}",
];

const POSITIVE_RESPONSES = [
    'Well... I guess I do taste okay...', // There's no world where this is po
    "After the {count(delta=*, suffix=True)} lick... I'm surprised that you're not tired of my flavors yet!",
    "I'm gonna lick you right back, c'mere you cutie! You taste like  +20 brownie points! {modifyBrowniePoints(delta=20)}",
    "Huh.. okay you've impressed me, that actually felt plenty nice! +40 brownie points! {modifyBrowniePoints(delta=40)}",
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 99 / 100;

const NAME = 'lick';
const DESCRIPTION = 'Uh.... what are you doing?';

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
