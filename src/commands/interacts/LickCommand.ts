import { CommandInteraction } from 'discord.js';
import { InteractCommand } from './InteractCommand';

const NEGATIVE_RESPONSES = [
    'Omg that is SO gross',
    'What the HECK!!',
    "What part of **NOT EDIBLE** didn't you understand?!",
    'Ew... ew ew ew ew EW!',
    "_sigh_ aren't you tired of this already?", 
    'Thanks... I guess?',
    'Please dont!',
    'Get AWAY from me with that tongue!!', 
    'H..how about we just stick to pets for now...'
];

const POSITIVE_RESPONSES = ['Well... I guess I do taste okay...']; // There's no world where this is po

const CHANCE_FOR_NEGATIVE_RESPONSE = 99/100;

const NAME = 'lick';
const DESCRIPTION = 'Uh.... what are you doing?';

const command = new InteractCommand(NAME, DESCRIPTION, 
    POSITIVE_RESPONSES, NEGATIVE_RESPONSES, CHANCE_FOR_NEGATIVE_RESPONSE);

export const builder = command.builder;
export const handler = command.handler;

export const guildOnly = (interaction: CommandInteraction) => false;

export const permissions = (interaction: CommandInteraction) => false;

export const shoudLoad = () => true;
