import log4js from 'log4js';
import Bot from './client/Bot';
import path from 'path';
import { IntentsBitField } from 'discord.js';

log4js.configure('./config/log4js.json');
const logger = log4js.getLogger('bot');

const REQUIRED_ENV_VARS: string[] = [
    'BOT_TOKEN',
    'BOT_APPLICATION_ID',
    'DATABASE_PATH',
];
for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
        logger.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const bot = new Bot(
    {
        intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.MessageContent],
        partials: [],
        token: process.env.BOT_TOKEN!,
        appId: process.env.BOT_APPLICATION_ID!,
        database: process.env.DATABASE_PATH!,
        debugGuildId: process.env.DEBUG_GUILD_ID,
        commandsFolder: path.join(__dirname, 'commands/'),
        eventsFolder: path.join(__dirname, 'events/'),
        componentHandlersFolder: path.join(__dirname, 'component_handlers/'),
        modalHandlersFolder: path.join(__dirname, 'modal_handlers/'),
    },
    logger
);

logger.info('Starting bot');
bot.run();
