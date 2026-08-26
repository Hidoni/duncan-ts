import { RecurrenceRule } from 'node-schedule';
import Bot from '../../../client/Bot';
import { ScheduledJobHandler } from '../../../interfaces/ScheduledJob';
import { addDaysToDate } from '../../../utils/DateUtils';
import { getChannel, getEnabled, runMapTapJobForDate } from '../MapTapUtils';

export const name: string = 'MapTap';

export const rule = new RecurrenceRule(
    undefined,
    undefined,
    undefined,
    undefined,
    0,
    0,
    0
);
rule.tz = 'Etc/GMT+12'; // Latest time zone

export const handler: ScheduledJobHandler = async (
    client: Bot,
    fireDate: Date
) => {
    const yesterday = addDaysToDate(fireDate, -1);
    client.logger?.info(
        `Running the MapTap job for date ${
            yesterday.toISOString().split('T')[0]
        }`
    );

    const mapTapChannelId = getChannel();
    if (mapTapChannelId === '0') {
        client.logger?.error(
            'MapTap channel ID is not set in config, skipping MapTap job...'
        );
        return;
    }
    const mapTapChannel = await client.channels.fetch(mapTapChannelId);
    if (
        !mapTapChannel ||
        !mapTapChannel.isSendable() ||
        mapTapChannel.isDMBased()
    ) {
        client.logger?.error(
            `Could not fetch the MapTap channel with id ${mapTapChannelId} or it is does not match requirements (sendable + not DM based)!`
        );
        return;
    }
    await runMapTapJobForDate(
        client,
        yesterday,
        mapTapChannel,
        mapTapChannel.guild
    );
};

export const shouldLoad = getEnabled;
