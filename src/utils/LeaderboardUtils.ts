import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    ContextMenuCommandInteraction,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    Snowflake,
} from 'discord.js';
import Bot from '../client/Bot';
import { ComponentHandler } from '../interfaces/ComponentHandler';
import { getSafeReplyFunction } from './InteractionUtils';

export const DEFAULT_EMBED_COLOR: readonly [number, number, number] = [
    251, 177, 189,
];

const CUSTOM_ID_PREFIX = 'lb';
const DEFAULT_PAGE_SIZE = 10;
const MAX_BUTTONS_PER_ROW = 5;
const SINGLE_BOARD_KEY = 'default';
const VALID_ID = /^[a-z0-9_]+$/;

type PageToken = 'FIRST' | 'LAST' | number;

export interface LeaderboardBoard<T> {
    label: string;
    valueColumnName: string;
    fetch: (client: Bot) => Promise<readonly T[]>;
    mapEntry: (entry: T, rank: number) => readonly [string, string];
}

export interface LeaderboardOptions {
    id: string;
    title: string;
    userColumnName?: string;
    color?: readonly [number, number, number];
    pageSize?: number;
}

export interface Leaderboard {
    reply: (
        client: Bot,
        interaction: CommandInteraction | ContextMenuCommandInteraction,
        board?: string
    ) => Promise<void>;
    componentHandler: ComponentHandler;
}

type ResolvedBoard = LeaderboardBoard<unknown> & { key: string };

interface LeaderboardContext {
    id: string;
    isGroup: boolean;
    boards: Map<string, ResolvedBoard>;
    boardOrder: ResolvedBoard[];
    defaultKey: string;
    userColumnName: string;
    color: readonly [number, number, number];
    pageSize: number;
    title: string;
}

// Discord routes a button click back to us only by its customId, so the whole
// query (which board, whose leaderboard, which page) has to round-trip inside it.
function baseCustomId(
    context: LeaderboardContext,
    boardKey: string,
    userId: Snowflake
): string {
    return context.isGroup
        ? `${CUSTOM_ID_PREFIX}:${context.id}:${boardKey}:${userId}`
        : `${CUSTOM_ID_PREFIX}:${context.id}:${userId}`;
}

function customIdPattern(id: string, isGroup: boolean): RegExp {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return isGroup
        ? new RegExp(
              `^${CUSTOM_ID_PREFIX}:${escaped}:([a-z0-9_]+):(\\d+):(FIRST|LAST|\\d+)$`
          )
        : new RegExp(
              `^${CUSTOM_ID_PREFIX}:${escaped}:(\\d+):(FIRST|LAST|\\d+)$`
          );
}

function notYourLeaderboardMessage(ownerId: Snowflake): string {
    return `OnO, I'm sowwy, but this isn't your leaderboard!! Only <@${ownerId}> can switch pages on this one!!`;
}

function resolvePage(token: PageToken, pageCount: number): number {
    if (token === 'FIRST') {
        return 1;
    }
    if (token === 'LAST') {
        return pageCount;
    }
    return Math.min(Math.max(1, token), pageCount);
}

function buildEmbed(
    context: LeaderboardContext,
    board: ResolvedBoard,
    entries: readonly unknown[],
    page: number,
    pageCount: number
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setTitle(context.isGroup ? board.label : context.title)
        .setColor(context.color)
        .setFooter({ text: `Page ${page} of ${pageCount}` });
    const start = (page - 1) * context.pageSize;
    const pageEntries = entries.slice(start, start + context.pageSize);
    if (pageEntries.length === 0) {
        return embed.setDescription('Nyo entries yet!');
    }
    const keyLines: string[] = [];
    const valueLines: string[] = [];
    pageEntries.forEach((entry, index) => {
        const rank = start + index + 1;
        const [key, value] = board.mapEntry(entry, rank);
        keyLines.push(`${rank}. ${key}`);
        valueLines.push(value);
    });
    return embed.addFields(
        {
            name: context.userColumnName,
            value: keyLines.join('\n'),
            inline: true,
        },
        {
            name: board.valueColumnName,
            value: valueLines.join('\n'),
            inline: true,
        }
    );
}

function pageButton(
    baseId: string,
    emoji: string,
    token: PageToken,
    disabled: boolean
): ButtonBuilder {
    return new ButtonBuilder()
        .setEmoji(emoji)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`${baseId}:${token}`)
        .setDisabled(disabled);
}

function buildPageRow(
    baseId: string,
    page: number,
    pageCount: number
): ActionRowBuilder<MessageActionRowComponentBuilder> {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        pageButton(baseId, '⏮', 'FIRST', page === 1),
        pageButton(baseId, '◀', page - 1, page === 1),
        pageButton(baseId, '▶', page + 1, page === pageCount),
        pageButton(baseId, '⏭', 'LAST', page === pageCount)
    );
}

function buildSwitcherRows(
    context: LeaderboardContext,
    currentKey: string,
    userId: Snowflake
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    const rows: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
    context.boardOrder.forEach((board, index) => {
        if (index % MAX_BUTTONS_PER_ROW === 0) {
            rows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>());
        }
        rows[rows.length - 1].addComponents(
            new ButtonBuilder()
                .setLabel(board.label)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(board.key === currentKey)
                .setCustomId(
                    `${CUSTOM_ID_PREFIX}:${context.id}:${board.key}:${userId}:FIRST`
                )
        );
    });
    return rows;
}

interface LeaderboardPayload {
    embeds: EmbedBuilder[];
    components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
}

async function render(
    client: Bot,
    context: LeaderboardContext,
    boardKey: string,
    token: PageToken,
    userId: Snowflake
): Promise<LeaderboardPayload> {
    const board =
        context.boards.get(boardKey) ?? context.boards.get(context.defaultKey)!;
    const entries = await board.fetch(client);
    const pageCount = Math.max(1, Math.ceil(entries.length / context.pageSize));
    const page = resolvePage(token, pageCount);
    const baseId = baseCustomId(context, board.key, userId);
    const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
        buildPageRow(baseId, page, pageCount),
    ];
    if (context.isGroup) {
        components.push(...buildSwitcherRows(context, board.key, userId));
    }
    return {
        embeds: [buildEmbed(context, board, entries, page, pageCount)],
        components,
    };
}

function buildLeaderboard(
    options: LeaderboardOptions,
    boardOrder: ResolvedBoard[],
    isGroup: boolean,
    defaultKey: string
): Leaderboard {
    if (!VALID_ID.test(options.id)) {
        throw new Error(
            `Leaderboard id "${options.id}" must match ${VALID_ID}`
        );
    }
    const boards = new Map(boardOrder.map((board) => [board.key, board]));
    if (!boards.has(defaultKey)) {
        throw new Error(
            `Leaderboard "${options.id}" has no board "${defaultKey}"`
        );
    }
    const context: LeaderboardContext = {
        id: options.id,
        isGroup,
        boards,
        boardOrder,
        defaultKey,
        userColumnName: options.userColumnName ?? 'User',
        color: options.color ?? DEFAULT_EMBED_COLOR,
        pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
        title: options.title,
    };
    const pattern = customIdPattern(options.id, isGroup);

    return {
        reply: async (client, interaction, board) => {
            const payload = await render(
                client,
                context,
                board ?? defaultKey,
                'FIRST',
                interaction.user.id
            );
            await getSafeReplyFunction(client, interaction)(payload);
        },
        componentHandler: {
            pattern,
            shouldLoad: () => true,
            handler: async (client, interaction) => {
                const match = interaction.customId.match(pattern);
                if (!match) {
                    return;
                }
                const [boardKey, ownerId, rawPage] = isGroup
                    ? [match[1], match[2], match[3]]
                    : [defaultKey, match[1], match[2]];
                if (ownerId !== interaction.user.id) {
                    await getSafeReplyFunction(
                        client,
                        interaction
                    )({
                        content: notYourLeaderboardMessage(ownerId),
                        ephemeral: true,
                    });
                    return;
                }
                const token: PageToken =
                    rawPage === 'FIRST' || rawPage === 'LAST'
                        ? rawPage
                        : Number.parseInt(rawPage, 10);
                await interaction.update(
                    await render(client, context, boardKey, token, ownerId)
                );
            },
        },
    };
}

export function defineBoard<T>(
    board: LeaderboardBoard<T>
): LeaderboardBoard<unknown> {
    return board as unknown as LeaderboardBoard<unknown>;
}

export function createLeaderboard<T>(
    options: LeaderboardOptions,
    board: Omit<LeaderboardBoard<T>, 'label'>
): Leaderboard {
    const resolved: ResolvedBoard = {
        ...(board as LeaderboardBoard<unknown>),
        label: options.title,
        key: SINGLE_BOARD_KEY,
    };
    return buildLeaderboard(options, [resolved], false, SINGLE_BOARD_KEY);
}

export function createLeaderboardGroup(
    options: LeaderboardOptions & { defaultBoard: string },
    boards: Record<string, LeaderboardBoard<unknown>>
): Leaderboard {
    const boardOrder: ResolvedBoard[] = Object.entries(boards).map(
        ([key, board]) => ({ ...board, key })
    );
    return buildLeaderboard(options, boardOrder, true, options.defaultBoard);
}
