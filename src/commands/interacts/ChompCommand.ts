import { CommandInteraction } from 'discord.js';
import { InteractCommand } from './InteractCommand';

const NEGATIVE_RESPONSES = [
    'OWWWW! What the heck!',
    '**WHY** do people keep trying to eat me??',
    "Ugh... I don't try to bite you!",
    'What is **wrong** with you?!?',
    'Ew! Who *knows* where that mouth has been',
    'QUIT IT!',
    "That's *sooo* hemkin gross",
    "Do you want me to bite you? My teeth are *very* sharp."
    // Do you have the emote for nightmare dunc? I don't
];

const POSITIVE_RESPONSES = [
    'Well... I guess I do taste pretty good',
    'Did Lykai tell you to do this? That stinky wuff...',
    "*sigh...*",
    "Gosh, you're so silly!"
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 49 / 50;

const NAME = 'chomp';
const DESCRIPTION = 'What... why is your mouth open like that...?';

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
