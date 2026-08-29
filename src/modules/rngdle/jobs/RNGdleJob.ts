import { RecurrenceRule } from 'node-schedule';
import Bot from '../../../client/Bot';
import { ScheduledJobHandler } from '../../../interfaces/ScheduledJob';
import { addDaysToDate } from '../../../utils/DateUtils';
import { getChannel, getEnabled, runRNGdleJobForDate } from '../RNGdleUtils';

export const name: string = 'RNGdle';

export const rule = new RecurrenceRule(
    undefined,
    undefined,
    undefined,
    undefined,
    0,
    0,
    0
);
rule.tz = 'Etc/UTC';

export const handler: ScheduledJobHandler = async (
    client: Bot,
    fireDate: Date
) => {
    const yesterday = addDaysToDate(fireDate, -1);
    client.logger?.info(
        `Running the RNGdle job for date ${
            yesterday.toISOString().split('T')[0]
        }`
    );

    const rngdleChannelId = getChannel();
    if (rngdleChannelId === '0') {
        client.logger?.error(
            'RNGdle channel ID is not set in config, skipping RNGdle job...'
        );
        return;
    }
    const rngdleChannel = await client.channels.fetch(rngdleChannelId);
    if (
        !rngdleChannel ||
        !rngdleChannel.isSendable() ||
        rngdleChannel.isDMBased()
    ) {
        client.logger?.error(
            `Could not fetch the RNGdle channel with id ${rngdleChannelId} or it is does not match requirements (sendable + not DM based)!`
        );
        return;
    }
    await runRNGdleJobForDate(
        client,
        yesterday,
        rngdleChannel,
        rngdleChannel.guild
    );
};

export const shouldLoad = getEnabled;
