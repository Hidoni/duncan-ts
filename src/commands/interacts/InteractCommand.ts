import { CommandHandler } from '../../interfaces/Command';
import { SlashCommandBuilder } from '@discordjs/builders';
import Bot from '../../client/Bot';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

const BROWNIE_POINT_REGEX =
    /{modifyBrowniePoints\(delta=(?<delta>[+-]?\d+)\)}/g;

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
        this.handler = async (
            client: Bot,
            interaction: ChatInputCommandInteraction
        ) => {
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

    protected async resolveBrowniePoints(
        client: Bot,
        interaction: ChatInputCommandInteraction,
        response: string
    ): Promise<string> {
        for (const match of response.matchAll(BROWNIE_POINT_REGEX)) {
            if (!match.groups) {
                continue;
            }
            const delta = Number.parseInt(match.groups['delta']);
            await client.database
                .getBrowniePoints(interaction.user.id)
                .then((points) => {
                    points.points += delta;
                    points.save();
                });
            response = response.replace(match[0], '');
        }
        return response;
    }

    protected async resolveSpecial(
        client: Bot,
        interaction: ChatInputCommandInteraction,
        response: string
    ): Promise<string> {
        return this.resolveBrowniePoints(client, interaction, response);
    }

    protected getMessage(
        _client: Bot,
        _interaction: ChatInputCommandInteraction
    ) {
        if (Math.random() <= this.chanceForNegativeResponse) {
            return this.negativeResponses[
                Math.floor(Math.random() * this.negativeResponses.length)
            ];
        }
        return this.positiveResponses[
            Math.floor(Math.random() * this.positiveResponses.length)
        ];
    }

    protected async getResponse(
        client: Bot,
        interaction: ChatInputCommandInteraction
    ) {
        return this.resolveSpecial(
            client,
            interaction,
            this.getMessage(client, interaction)
        ).then((response) => response.trim());
    }
}

export const shouldLoad = () => false;
