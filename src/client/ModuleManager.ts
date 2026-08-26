import { Collection } from 'discord.js';
import glob from 'glob';
import { Logger } from 'log4js';
import { scheduleJob } from 'node-schedule';
import path from 'path';
import { ModelCtor } from 'sequelize-typescript';
import { Command, CommandBuilderType } from '../interfaces/Command';
import { ComponentHandler } from '../interfaces/ComponentHandler';
import { Event } from '../interfaces/Event';
import { ModalHandler } from '../interfaces/ModalHandler';
import { LoadedModule, Module, RegisteredEvent } from '../interfaces/Module';
import { ScheduledJob } from '../interfaces/ScheduledJob';
import Bot from './Bot';

const MODULE_ENTRY_POINT = 'index.js';
const READY_EVENT = 'ready';

export function discoverModules(
    modulesFolder: string,
    logger?: Logger
): Module[] {
    const modules: Module[] = [];
    for (const file of glob.sync(
        path.join(modulesFolder, '*', MODULE_ENTRY_POINT)
    )) {
        try {
            const module = require(file).default as Module | undefined;
            if (!module?.name) {
                throw new Error('module has no default-exported Module');
            }
            modules.push(module);
        } catch (error) {
            logger?.error(`Failed to load module at ${file}: ${error}`);
        }
    }
    logger?.info(
        `Succesfully loaded ${modules.length} modules: ${modules
            .map((module) => module.name)
            .join(', ')}`
    );
    return modules;
}

export function collectModels(modules: Module[]): ModelCtor[] {
    return modules.flatMap((module) => module.models ?? []);
}

function describeLoadedModule(loaded: LoadedModule): string {
    return [
        `${loaded.commands.length} commands`,
        `${loaded.events.length} events`,
        `${loaded.componentHandlers.length} component handlers`,
        `${loaded.modalHandlers.length} modal handlers`,
        `${loaded.jobs.length} jobs`,
    ].join(', ');
}

export default class ModuleManager {
    private client: Bot;
    private logger?: Logger;
    private configuredModules: Module[] = [];
    private loadedModules: Collection<string, LoadedModule> = new Collection();
    private commands: Collection<string, Command<CommandBuilderType>> =
        new Collection();
    private componentHandlers: Collection<RegExp, ComponentHandler> =
        new Collection();
    private modalHandlers: Collection<RegExp, ModalHandler> = new Collection();
    private clientReady: boolean = false;

    public constructor(client: Bot, logger?: Logger) {
        this.client = client;
        this.logger = logger;
        this.client.once(READY_EVENT, () => {
            this.clientReady = true;
            for (const loaded of this.loadedModules.values()) {
                this.startJobs(loaded);
            }
        });
    }

    public loadAll(modules: Module[]): void {
        this.configuredModules = modules;
        for (const module of modules) {
            this.load(module);
        }
        this.logger?.info(
            `Succesfully registered ${this.componentHandlers.size} component handlers`
        );
        this.logger?.info(
            `Succesfully registered ${this.modalHandlers.size} modal handlers`
        );
    }

    public load(module: Module): LoadedModule | undefined {
        if (this.loadedModules.has(module.name)) {
            this.logger?.error(
                `Refusing to load module ${module.name}: it is already loaded`
            );
            return undefined;
        }
        const loaded: LoadedModule = {
            module: module,
            commands: [],
            events: [],
            componentHandlers: [],
            modalHandlers: [],
            jobs: [],
            scheduledJobs: [],
        };
        try {
            this.loadCommands(module.commands ?? [], loaded);
            this.loadEvents(module.events ?? [], loaded);
            this.loadComponentHandlers(module.componentHandlers ?? [], loaded);
            this.loadModalHandlers(module.modalHandlers ?? [], loaded);
            this.loadJobs(module.jobs ?? [], loaded);
        } catch (error) {
            this.logger?.error(
                `Failed to load module ${module.name}, rolling back: ${error}`
            );
            this.unregister(loaded);
            return undefined;
        }
        this.loadedModules.set(module.name, loaded);
        this.logger?.info(
            `Loaded module ${module.name} (${describeLoadedModule(loaded)})`
        );
        if (this.clientReady) {
            this.runMissedReadyEvents(loaded);
        }
        return loaded;
    }

    public unload(moduleName: string): LoadedModule | undefined {
        const loaded = this.loadedModules.get(moduleName);
        if (!loaded) {
            this.logger?.error(
                `Cannot unload module ${moduleName}: it is not loaded`
            );
            return undefined;
        }
        this.unregister(loaded);
        this.loadedModules.delete(moduleName);
        this.logger?.info(`Unloaded module ${moduleName}`);
        return loaded;
    }

    public reload(moduleName: string): LoadedModule | undefined {
        const module =
            this.loadedModules.get(moduleName)?.module ??
            this.configuredModules.find(
                (configured) => configured.name === moduleName
            );
        if (!module) {
            this.logger?.error(`Cannot reload unknown module ${moduleName}`);
            return undefined;
        }
        if (this.loadedModules.has(moduleName)) {
            this.unload(moduleName);
        }
        return this.load(module);
    }

    public getLoadedModuleNames(): string[] {
        return Array.from(this.loadedModules.keys());
    }

    public getCommands(): Collection<string, Command<CommandBuilderType>> {
        return this.commands;
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

    private unregister(loaded: LoadedModule): void {
        for (const command of loaded.commands) {
            const commandName = command.builder.name;
            if (this.commands.get(commandName) === command) {
                this.commands.delete(commandName);
            }
        }
        for (const componentHandler of loaded.componentHandlers) {
            if (
                this.componentHandlers.get(componentHandler.pattern) ===
                componentHandler
            ) {
                this.componentHandlers.delete(componentHandler.pattern);
            }
        }
        for (const modalHandler of loaded.modalHandlers) {
            if (this.modalHandlers.get(modalHandler.pattern) === modalHandler) {
                this.modalHandlers.delete(modalHandler.pattern);
            }
        }
        for (const event of loaded.events) {
            this.client.off(event.name, event.listener);
        }
        for (const scheduledJob of loaded.scheduledJobs) {
            scheduledJob.cancel();
        }
        loaded.scheduledJobs.length = 0;
    }

    private loadCommands(
        commands: Command<CommandBuilderType>[],
        loaded: LoadedModule
    ) {
        for (const command of commands) {
            if (command.shouldLoad()) {
                const commandName = command.builder.name;
                if (this.commands.has(commandName)) {
                    throw new Error(
                        `module ${loaded.module.name} claims command name ${commandName}, which another loaded module already provides`
                    );
                }
                this.commands.set(commandName, command);
                loaded.commands.push(command);
            }
        }
    }

    private loadEvents(events: Event[], loaded: LoadedModule) {
        for (const event of events) {
            if (event.shouldLoad()) {
                loaded.events.push(this.registerEvent(event.name, event));
            }
        }
    }

    private loadComponentHandlers(
        componentHandlers: ComponentHandler[],
        loaded: LoadedModule
    ) {
        for (const componentHandler of componentHandlers) {
            if (componentHandler.shouldLoad()) {
                this.componentHandlers.set(
                    componentHandler.pattern,
                    componentHandler
                );
                loaded.componentHandlers.push(componentHandler);
            }
        }
    }

    private loadModalHandlers(
        modalHandlers: ModalHandler[],
        loaded: LoadedModule
    ) {
        for (const modalHandler of modalHandlers) {
            if (modalHandler.shouldLoad()) {
                this.modalHandlers.set(modalHandler.pattern, modalHandler);
                loaded.modalHandlers.push(modalHandler);
            }
        }
    }

    private loadJobs(jobs: ScheduledJob[], loaded: LoadedModule) {
        for (const job of jobs) {
            if (job.shouldLoad()) {
                loaded.jobs.push(job);
            }
        }
        if (this.clientReady) {
            this.startJobs(loaded);
        }
    }

    private startJobs(loaded: LoadedModule): void {
        for (const job of loaded.jobs) {
            this.logger?.info(
                `Setting up the ${
                    job.name
                } job, first invocation at ${job.rule.nextInvocationDate(
                    new Date()
                )}`
            );
            loaded.scheduledJobs.push(
                scheduleJob(job.rule, (fireDate) =>
                    job
                        .handler(this.client, fireDate)
                        .catch((error) =>
                            this.logger?.error(
                                `Failed to run the ${job.name} job: ${error}`
                            )
                        )
                )
            );
        }
    }

    private registerEvent(eventName: string, event: Event): RegisteredEvent {
        let wrapper = async function (bot: Bot) {
            event
                .handler(bot, ...Array.from(arguments).slice(1))
                .catch((error) => {
                    bot.logger?.error(
                        `Failed to execute event ${eventName}: ${error}`
                    );
                });
        }.bind(null, this.client);
        if (event.once) {
            this.client.once(eventName, wrapper);
        } else {
            this.client.on(eventName, wrapper);
        }
        this.logger?.info(
            `Registered event ${eventName} (once=${!!event.once})`
        );
        return { name: eventName, listener: wrapper };
    }

    private runMissedReadyEvents(loaded: LoadedModule): void {
        for (const event of loaded.events) {
            if (event.name === READY_EVENT) {
                this.logger?.info(
                    `Replaying the ${READY_EVENT} event for module ${
                        loaded.module.name
                    }`
                );
                event.listener(this.client);
            }
        }
    }
}
