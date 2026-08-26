import { Logger } from 'log4js';
import {
    APIApplicationCommand,
    Client,
    Collection,
    Snowflake,
} from 'discord.js';
import BotConfig from '../interfaces/BotConfig';
import { Command, CommandBuilderType } from '../interfaces/Command';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { ComponentHandler } from '../interfaces/ComponentHandler';
import Database from '../database/DatabaseObject';
import { ModalHandler } from '../interfaces/ModalHandler';
import { Module } from '../interfaces/Module';
import ModuleManager, { collectModels } from './ModuleManager';

export default class Bot extends Client {
    public logger?: Logger;
    public database: Database;
    private modules: ModuleManager;
    private commandIds: Collection<string, Snowflake> = new Collection();
    private restAPI: REST;
    private config: BotConfig;

    public constructor(config: BotConfig, logger?: Logger) {
        super({ intents: config.intents, partials: config.partials });
        this.config = config;
        this.logger = logger;
        this.restAPI = new REST().setToken(config.token);
        this.database = new Database(
            config.database,
            collectModels(config.modules),
            logger
        );

        this.modules = new ModuleManager(this, logger);
        this.modules.loadAll(config.modules);
    }

    public async run() {
        await Promise.all([
            this.login(this.config.token),
            this.registerCommands(),
        ]);
    }

    public getCommand(
        commandName: string
    ): Command<CommandBuilderType> | undefined {
        return this.modules.getCommand(commandName);
    }

    public getComponentHandler(
        componentId: string
    ): ComponentHandler | undefined {
        return this.modules.getComponentHandler(componentId);
    }

    public getModalHandler(modalId: string): ModalHandler | undefined {
        return this.modules.getModalHandler(modalId);
    }

    public getLoadedModuleNames(): string[] {
        return this.modules.getLoadedModuleNames();
    }

    public async loadModule(module: Module): Promise<boolean> {
        const loaded = this.modules.load(module);
        if (!loaded) {
            return false;
        }
        for (const command of loaded.commands) {
            await this.createCommand(command);
        }
        return true;
    }

    public async unloadModule(moduleName: string): Promise<boolean> {
        const loaded = this.modules.unload(moduleName);
        if (!loaded) {
            return false;
        }
        for (const command of loaded.commands) {
            await this.deleteCommand(command.builder.name);
        }
        return true;
    }

    public async reloadModule(moduleName: string): Promise<boolean> {
        const loaded = this.modules.reload(moduleName);
        await this.registerCommands();
        return loaded !== undefined;
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

    public async registerCommands(): Promise<void> {
        const route = this.getCommandsRoute();
        try {
            const commandsJSON = this.modules
                .getCommands()
                .map((command) => command.builder.toJSON());
            const registeredCommands = (await this.restAPI.put(route, {
                body: commandsJSON,
            })) as APIApplicationCommand[];
            this.cacheCommandIds(registeredCommands);
            this.logger?.info(
                `Succesfully registered ${commandsJSON.length} commands`
            );
        } catch (error) {
            this.logger?.error(`Error registering commands: ${error}`);
        }
    }

    public async createCommand(
        command: Command<CommandBuilderType>
    ): Promise<boolean> {
        const commandName = command.builder.name;
        try {
            const registeredCommand = (await this.restAPI.post(
                this.getCommandsRoute(),
                { body: command.builder.toJSON() }
            )) as APIApplicationCommand;
            this.commandIds.set(registeredCommand.name, registeredCommand.id);
            this.logger?.info(
                `Published command ${commandName} (${registeredCommand.id}) to Discord`
            );
            return true;
        } catch (error) {
            this.logger?.error(
                `Failed to publish command ${commandName}: ${error}`
            );
            return false;
        }
    }

    public async deleteCommand(commandName: string): Promise<boolean> {
        const commandId = await this.resolveCommandId(commandName);
        if (!commandId) {
            this.logger?.warn(
                `Could not delete command ${commandName}: it is not registered with Discord`
            );
            return false;
        }
        try {
            await this.restAPI.delete(this.getCommandRoute(commandId));
            this.commandIds.delete(commandName);
            this.logger?.info(
                `Deleted command ${commandName} (${commandId}) from Discord`
            );
            return true;
        } catch (error) {
            this.logger?.error(
                `Failed to delete command ${commandName} (${commandId}): ${error}`
            );
            return false;
        }
    }

    private async resolveCommandId(
        commandName: string
    ): Promise<Snowflake | undefined> {
        if (!this.commandIds.has(commandName)) {
            await this.fetchRegisteredCommands();
        }
        return this.commandIds.get(commandName);
    }

    private async fetchRegisteredCommands(): Promise<void> {
        try {
            const registeredCommands = (await this.restAPI.get(
                this.getCommandsRoute()
            )) as APIApplicationCommand[];
            this.cacheCommandIds(registeredCommands);
        } catch (error) {
            this.logger?.error(`Failed to fetch registered commands: ${error}`);
        }
    }

    private cacheCommandIds(commands: APIApplicationCommand[]): void {
        this.commandIds = new Collection(
            commands.map((command) => [command.name, command.id])
        );
    }
}
