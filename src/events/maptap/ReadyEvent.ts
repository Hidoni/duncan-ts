import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import schedule from 'node-schedule';
import { addDaysToDate } from '../../utils/DateUtils';
import {
    getChannel,
    getEnabled,
    runMapTapJobForDate,
} from '../../utils/MapTapUtils';

export const name: string = 'ready';
export const handler: EventHandler = async (client: Bot) => {
    let rule = new schedule.RecurrenceRule(
        undefined,
        undefined,
        undefined,
        undefined,
        0,
        0,
        0
    );
    rule.tz = 'Etc/GMT+12'; // Latest time zone
    client.logger?.info(
        `Setting up the MapTap job, first invocation at ${rule.nextInvocationDate(
            new Date()
        )}`
    );
    schedule.scheduleJob(rule, async (fireDate) => {
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
    });
};
export const once: boolean = true;
export const shouldLoad = getEnabled;
