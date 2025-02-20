import Bot from '../../client/Bot';
import { ChatInputCommandInteraction } from 'discord.js';
import { InteractCommand } from './InteractCommand';
import { CommandUsage } from '../../database/models/CommandUsage';

export class CountedInteractCommand extends InteractCommand {
    public constructor(
        name: string,
        description: string,
        positiveResponses: string[],
        negativeResponses: string[],
        chanceForNegativeResponse: number
    ) {
        super(name, description, positiveResponses, negativeResponses, chanceForNegativeResponse);

        const originalHandler = this.handler;
        this.handler = async (client: Bot, interaction: ChatInputCommandInteraction) => {
            const userId = interaction.user.id;
            const commandName = name;
            try {
                let record = await CommandUsage.findOne({ where: { user: userId, commandName } });
                if (record) {
                    record.count++;
                    await record.save();
                } else {
                    await CommandUsage.create({ user: userId, commandName, count: 1 });
                }
            } catch (error) {
                console.error('Error updating command usage count:', error);
            }

            await originalHandler(client, interaction);
        };
    }
}
