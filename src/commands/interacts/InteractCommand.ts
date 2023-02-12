import { CommandHandler } from '../../interfaces/Command';
import { SlashCommandBuilder } from '@discordjs/builders';
import Bot from '../../client/Bot';
import { CommandInteraction } from 'discord.js';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

export class InteractCommand {
    public handler: CommandHandler;
    public builder: SlashCommandBuilder;

    public constructor(name: string, description: string, 
        positive_responses: string[], negative_responses: string[], 
        chance_for_negative_response: number) {

        this.handler = async (
            client: Bot,
            interaction: CommandInteraction
        ) => {
            if (Math.random() <= chance_for_negative_response) {
                await getSafeReplyFunction(
                    client,
                    interaction
                )({
                    content:
                        negative_responses[
                            Math.floor(Math.random() * negative_responses.length)
                        ],
                });
            } else {
                await getSafeReplyFunction(
                    client,
                    interaction
                )({
                    content:
                        positive_responses[
                            Math.floor(Math.random() * positive_responses.length)
                        ],
                });
            }
        };

        this.builder = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
    };
};

export const shouldLoad = () => false;
