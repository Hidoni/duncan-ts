import { CommandHandler } from '../../interfaces/Command';
import { SlashCommandBuilder } from '@discordjs/builders';
import Bot from '../../client/Bot';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import {
    getRandomUserToMentionInGuild,
    getSafeReplyFunction,
    getUserPreferredName,
} from '../../utils/InteractionUtils';

const BROWNIE_POINT_REGEX =
    /{modifyBrowniePoints\(delta=(?<delta>[+-]?\d+)\)}/g;

const SENDER_MENTION_REGEX = /{sender}/g;
const RANDOM_MENTION_REGEX = /{random(?:_\d+)?}/g;

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

    protected async resolveMentions(
        client: Bot,
        interaction: ChatInputCommandInteraction,
        response: string
    ): Promise<string> {
        if (!interaction.guild) {
            return response;
        }
        response = response.replace(
            SENDER_MENTION_REGEX,
            await getUserPreferredName(
                client,
                interaction.user.id,
                interaction.guild
            )
        );
        const randomUserBlacklist = [client.user!.id, interaction.user.id];
        for (const match of response.matchAll(RANDOM_MENTION_REGEX)) {
            const randomUser = await getRandomUserToMentionInGuild(
                interaction.guild,
                randomUserBlacklist
            );
            randomUserBlacklist.push(randomUser.id);
            response = response.replace(
                match[0],
                await getUserPreferredName(
                    client,
                    randomUser.id,
                    interaction.guild
                )
            );
        }
        return response;
    }

    protected async resolveSpecial(
        client: Bot,
        interaction: ChatInputCommandInteraction,
        response: string
    ): Promise<string> {
        return this.resolveBrowniePoints(client, interaction, response).then(
            async (response) =>
                this.resolveMentions(client, interaction, response)
        );
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
