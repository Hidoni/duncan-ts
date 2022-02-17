import { Logger } from 'log4js';
import { Client, Collection } from 'discord.js';
import BotConfig from '../interfaces/BotConfig';
import { Command, CommandBuilderType } from '../interfaces/Command';
import { Event } from '../interfaces/Event';
import path from 'path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import glob from 'glob';
import { ComponentHandler } from '../interfaces/ComponentHandler';
import Database from '../database/DatabaseObject';
import { ModalHandler } from '../interfaces/ModalHandler';

export default class Bot extends Client {
    public logger?: Logger;
    private commands: Collection<string, Command<CommandBuilderType>> =
        new Collection();
    private componentHandlers: Collection<RegExp, ComponentHandler> =
        new Collection();
    private modalHandlers: Collection<RegExp, ModalHandler> = new Collection();
    private restAPI: REST;
    private config: BotConfig;
    public database: Database;

    public constructor(config: BotConfig, logger?: Logger) {
        super({ intents: config.intents, partials: config.partials });
        this.config = config;
        this.logger = logger;
        this.restAPI = new REST({ version: '9' }).setToken(config.token);
        this.database = new Database(config.database);

        if (config.commandsFolder) {
            this.loadCommands(config.commandsFolder);
        }
        if (config.eventsFolder) {
            this.loadEvents(config.eventsFolder);
        }
        if (config.componentHandlersFolder) {
            this.loadComponentHandlers(config.componentHandlersFolder);
        }
        if (config.modalHandlersFolder) {
            this.loadModalHandlers(config.modalHandlersFolder);
        }
    }

    private loadCommands(folder: string) {
        try {
            glob.sync(path.join(folder, '**/*.js')).forEach((file: string) => {
                try {
                    const handler: Command<CommandBuilderType> = require(file);
                    if (handler.shoudLoad()) {
                        this.commands.set(handler.builder.name, handler);
                    }
                } catch (error) {
                    this.logger?.error(
                        `Failed to load command at ${file}: ${error}`
                    );
                }
            });
        } catch (error) {
            this.logger?.error(`Failed to load commands: ${error}`);
        }
    }

    private loadEvents(folder: string) {
        try {
            glob.sync(path.join(folder, '**/*.js')).forEach((file: string) => {
                try {
                    const handler: Event = require(file);
                    if (handler.shoudLoad()) {
                        this.registerEvent(handler.name, handler);
                    }
                } catch (error) {
                    this.logger?.error(
                        `Failed to load event at ${file}: ${error}`
                    );
                }
            });
        } catch (error) {
            this.logger?.error(`Failed to load events: ${error}`);
        }
    }

    private loadComponentHandlers(folder: string) {
        try {
            glob.sync(path.join(folder, '**/*.js')).forEach((file: string) => {
                try {
                    const handler: ComponentHandler = require(file);
                    if (handler.shoudLoad()) {
                        this.componentHandlers.set(handler.pattern, handler);
                    }
                } catch (error) {
                    this.logger?.error(
                        `Failed to load component handler at ${file}: ${error}`
                    );
                }
            });
            this.logger?.info(
                `Succesfully registered ${this.componentHandlers.size} component handlers`
            );
        } catch (error) {
            this.logger?.error(`Failed to load component handlers: ${error}`);
        }
    }

    private loadModalHandlers(folder: string) {
        try {
            glob.sync(path.join(folder, '**/*.js')).forEach((file: string) => {
                try {
                    const handler: ModalHandler = require(file);
                    if (handler.shoudLoad()) {
                        this.modalHandlers.set(handler.pattern, handler);
                    }
                } catch (error) {
                    this.logger?.error(
                        `Failed to load modal handler at ${file}: ${error}`
                    );
                }
            });
            this.logger?.info(
                `Succesfully registered ${this.modalHandlers.size} modal handlers`
            );
        } catch (error) {
            this.logger?.error(`Failed to load modal handlers: ${error}`);
        }
    }

    public getCommand(
        commandName: string
    ): Command<CommandBuilderType> | undefined {
        return this.commands.get(commandName);
    }

    public getComponentHandler(
        componentId: string
    ): ComponentHandler | undefined {
        for (const { 0: idPattern, 1: componentHandler } of this
            .componentHandlers) {
            if (idPattern.test(componentId)) {
                return componentHandler;
            }
        }
        return undefined;
    }

    public getModalHandler(modalId: string): ModalHandler | undefined {
        for (const { 0: idPattern, 1: modalHandler } of this.modalHandlers) {
            if (idPattern.test(modalId)) {
                return modalHandler;
            }
        }
        return undefined;
    }

    public async run() {
        this.login(this.config.token);
        if (await this.deleteAllCommands()) {
            await this.registerCommands();
        } else {
            this.logger?.error(
                `Failed to delete all commands, commands will not be registered!`
            );
        }
    }

    private registerEvent(eventName: string, event: Event): void {
        let wrapper = async function (bot: Bot) {
            event
                .handler(bot, ...Array.from(arguments).slice(1))
                .catch((error) => {
                    bot.logger?.error(
                        `Failed to execute event ${eventName}: ${error}`
                    );
                });
        }.bind(null, this);
        if (event.once) {
            this.once(eventName, wrapper);
        } else {
            this.on(eventName, wrapper);
        }
        this.logger?.info(
            `Registered event ${eventName} (once=${!!event.once})`
        );
    }

    private getCommandsRoute():
        | `/applications/${string}/guilds/${string}/commands`
        | `/applications/${string}/commands` {
        return this.config.debugGuildId
            ? Routes.applicationGuildCommands(
                  this.config.appId,
                  this.config.debugGuildId
              )
            : Routes.applicationCommands(this.config.appId);
    }

    private getCommandRoute(
        commandId: string
    ):
        | `/applications/${string}/guilds/${string}/commands/${string}`
        | `/applications/${string}/commands/${string}` {
        return this.config.debugGuildId
            ? Routes.applicationGuildCommand(
                  this.config.appId,
                  this.config.debugGuildId,
                  commandId
              )
            : Routes.applicationCommand(this.config.appId, commandId);
    }

    private async deleteAllCommands(): Promise<boolean> {
        let route = this.getCommandsRoute();
        try {
            const commands = await this.restAPI.get(route);
            let promises: Promise<unknown>[] = [];
            if (commands instanceof Array && commands.length > 0) {
                for (const command of commands) {
                    promises.push(
                        this.restAPI.delete(this.getCommandRoute(command.id))
                    );
                }
            }
            await Promise.all(promises);
            return true;
        } catch (error) {
            this.logger?.error(`Failed to delete all commands: ${error}`);
        }
        return false;
    }

    private async registerCommands(): Promise<void> {
        let route = this.getCommandsRoute();
        try {
            const commandsJSON = this.commands.map((command) =>
                command.builder.toJSON()
            );
            await this.restAPI.put(route, { body: commandsJSON });
            this.logger?.info(
                `Succesfully registered ${commandsJSON.length} commands`
            );
        } catch (error) {
            this.logger?.error(`Error loading commands: ${error}`);
        }
    }
}
