import { CommandHandler } from '../../interfaces/Command';
import { SlashCommandBuilder } from '@discordjs/builders';
import Bot from '../../client/Bot';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

export class InteractCommand {
    public handler: CommandHandler;
    public builder: SlashCommandBuilder;

    protected positiveResponses: readonly string[];
    protected negativeResponses: readonly string[];
    protected chanceForNegativeResponse: number;

    public constructor(
        name: string,
        description: string,
        positiveResponses: string[],
        negativeResponses: string[],
        chanceForNegativeResponse: number
    ) {
        this.positiveResponses = positiveResponses;
        this.negativeResponses = negativeResponses;
        this.chanceForNegativeResponse = chanceForNegativeResponse;
        this.handler = async (client: Bot, interaction: ChatInputCommandInteraction) => {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content: await this.getResponse(client, interaction),
            });
        };

        this.builder = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
    }

    protected async getResponse(client: Bot, interaction: ChatInputCommandInteraction) {
        if (Math.random() <= this.chanceForNegativeResponse) {
            return this.negativeResponses[
                Math.floor(Math.random() * this.negativeResponses.length)
            ];
        }
        return this.positiveResponses[
            Math.floor(Math.random() * this.positiveResponses.length)
        ];
    }
}

export const shouldLoad = () => false;
