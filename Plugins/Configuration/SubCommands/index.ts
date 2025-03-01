import { commandOptions as addChannelOptions, AddChannelSubCommand } from './AddChannelSubCommand';
import {
    commandOptions as removeChannelOptions,
    RemoveChannelSubCommand,
} from './RemoveChannelSubCommand';
import { commandOptions as addRoleOptions, AddRoleSubCommand } from './AddRoleSubCommand';
import { commandOptions as removeRoleOptions, RemoveRoleSubCommand } from './RemoveRoleSubCommand';
import { commandOptions as viewOptions, ViewChannelSubCommand } from './ViewSubCommand';
import { commandOptions as addTopicOptions, AddTopicSubCommand } from './AddTopicSubCommand';
import {
    commandOptions as removeTopicOptions,
    RemoveTopicSubCommand,
} from './RemoveTopicSubCommand';
import { commandOptions as viewTopicsOptions, ViewTopicsSubCommand } from './ViewTopicsSubCommand';

export const subCommandOptions = [
    addChannelOptions,
    removeChannelOptions,
    addRoleOptions,
    removeRoleOptions,
    viewOptions,
    addTopicOptions,
    removeTopicOptions,
    viewTopicsOptions,
];

export {
    AddChannelSubCommand,
    RemoveChannelSubCommand,
    AddRoleSubCommand,
    RemoveRoleSubCommand,
    ViewChannelSubCommand,
    AddTopicSubCommand,
    RemoveTopicSubCommand,
    ViewTopicsSubCommand,
};
