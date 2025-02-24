import Bot from '../../client/Bot';
import { ChatInputCommandInteraction } from 'discord.js';
import { InteractCommand } from './InteractCommand';

const COUNT_REGEX =
    /{count\(delta=(?<delta>\d+|\*),\s*suffix=(?<suffix>[Tt]rue|[Ff]alse)\)}/g;
const COUNT_RAW_DELTA_ALL = '*';
const SECONDS_TO_MILLISECONDS = 1000;

export function appendSuffix(number: number): string {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;
    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return number + 'st';
    }
    if (lastDigit === 2 && lastTwoDigits !== 12) {
        return number + 'nd';
    }
    if (lastDigit === 3 && lastTwoDigits !== 13) {
        return number + 'rd';
    }
    return number + 'th';
}

export function dateFromDelta(delta: number): Date {
    return new Date(Date.now() - delta * SECONDS_TO_MILLISECONDS);
}

export class CountedInteractCommand extends InteractCommand {
    constructor(
        name: string,
        description: string,
        positiveResponses: string[],
        negativeResponses: string[],
        chanceForNegativeResponse: number
    ) {
        super(
            name,
            description,
            positiveResponses,
            negativeResponses,
            chanceForNegativeResponse
        );
    }

    protected async resolveCount(
        client: Bot,
        interaction: ChatInputCommandInteraction,
        delta: number | null,
        suffix: boolean
    ): Promise<string> {
        const count = await (delta
            ? client.database.getCommandUsageByUserSince(
                  interaction.user.id,
                  interaction.commandName,
                  dateFromDelta(delta)
              )
            : client.database.getAllCommandUsageByUser(
                  interaction.user.id,
                  interaction.commandName
              ));
        return suffix ? appendSuffix(count) : count.toString();
    }

    protected async resolveCounts(
        client: Bot,
        interaction: ChatInputCommandInteraction,
        response: string
    ): Promise<string> {
        for (const match of response.matchAll(COUNT_REGEX)) {
            if (!match.groups) {
                continue;
            }
            const rawDelta = match.groups['delta'];
            const delta =
                rawDelta == COUNT_RAW_DELTA_ALL
                    ? null
                    : Number.parseInt(rawDelta);
            const suffix = match.groups['suffix'].toLowerCase() === 'true';
            response = response.replace(
                match[0],
                await this.resolveCount(client, interaction, delta, suffix)
            );
        }
        return response;
    }

    protected async getResponse(
        client: Bot,
        interaction: ChatInputCommandInteraction
    ): Promise<string> {
        await client.database.newCommandUsage(interaction.user.id, interaction.commandName);
        return super
            .getResponse(client, interaction)
            .then(async (response) =>
                this.resolveCounts(client, interaction, response)
            );
    }
}

export const shouldLoad = () => false;
