import { CommandInteraction } from 'discord.js';
import { CountedInteractCommand } from './CountedInteractCommand';

const NEGATIVE_RESPONSES = [
    'OWWWW! What the heck!',
    '**WHY** do people keep trying to eat me??',
    "Ugh... I don't try to bite you!",
    'What is **wrong** with you?!?',
    'Ew! Who *knows* where that mouth has been... TwT',
    'QUIT IT!',
    "That's *sooo* hemkin gross!",
    'Do you want me to bite you? My teeth are *very* sharp.',
    "C'mon, you really thought the {count(delta=*, suffix=True)} chomp wasn't enough?",
    "Did you think I'd be fine with it after your {count(delta=*, suffix=True)} chomp? Nope. Go away.",
    'Get some help! Or go chomp {random} instead!',
    "Bite me one more time and it'll be the last time you can move your jaw!",
    'I will remember this chomp... and I will plot my sweet revenge!',
    "And you didn't even think to brush your teeth before? That was at least -30 brownie points. {modifyBrowniePoints(delta=-30)}",
];

const POSITIVE_RESPONSES = [
    'Well... I guess I do taste pretty good',
    'Did Lykai tell you to do this? That stinky wuff...',
    '*sigh...*',
    "Gosh, you're so silly!",
    "Well, it's fine as long as you give candy! These sprinkles take time and sugar to regrow, yknow!",
    'Just this once!!',
    "Fiiine... just this once... because I am a kind and sweet sprinkledog.",
    "Hahaha what the heck! I didn't know I tickle there! That was great, here are +40 brownie points for you! {modifyBrowniePoints(delta=40)}"
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 49 / 50;
const NAME = 'chomp';
const DESCRIPTION = 'What... why is your mouth open like that...?';

export const { builder, handler } = new CountedInteractCommand(
    NAME,
    DESCRIPTION,
    POSITIVE_RESPONSES,
    NEGATIVE_RESPONSES,
    CHANCE_FOR_NEGATIVE_RESPONSE
);

export const guildOnly = (_interaction: CommandInteraction) => false;
export const permissions = (_interaction: CommandInteraction) => false;
export const shouldLoad = () => true;
