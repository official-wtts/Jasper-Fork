import { ApplicationCommandOptionType } from '@antibot/interactions';
import { Context } from '../../../Source/Context';
import { ButtonStyle, ChatInputCommandInteraction, ComponentType, MessageFlags } from 'discord.js';
import { defineSubCommand } from '../../../Common/define';
import { Options, SetTopicOptions } from '../../../Services/SettingsService';
import { chunk } from '../../../Common/array';

export const RemoveTopicSubCommand = defineSubCommand({
    name: 'remove_topic',
    handler: async (ctx: Context, interaction: ChatInputCommandInteraction) => {
        const guildId = interaction.guildId!;
        const input = interaction.options.getString('topic')!;

        await ctx.services.settings.configure<Options>({ guildId });
        const topicsExistInDB = await ctx.services.settings.getTopics<string>(guildId, 'Topics');

        const pages = chunk(topicsExistInDB, 10);
        const initialState = { addTopicPages: { page: 0, pages } };

        ctx.pagination.set(interaction.user.id, initialState);
        const state = ctx.pagination.get(interaction.user.id);

        if (!state || !state.addTopicPages) {
            await interaction.reply({
                content: 'Failed to initialize pagination state',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const components = [
            {
                type: ComponentType.ActionRow as const,
                components: [
                    {
                        type: ComponentType.Button as const,
                        customId: `add_topic_subcommand_button_previous_${interaction.user.id}`,
                        style: ButtonStyle.Primary as const,
                        label: 'Previous',
                        disabled: state.addTopicPages.page === 0,
                    },
                    {
                        type: ComponentType.Button as const,
                        customId: `add_topic_subcommand_button_home_${interaction.user.id}`,
                        style: ButtonStyle.Secondary as const,
                        label: 'Home',
                    },
                    {
                        type: ComponentType.Button as const,
                        customId: `add_topic_subcommand_button_next_${interaction.user.id}`,
                        style: ButtonStyle.Primary as const,
                        label: 'Next',
                        disabled: state.addTopicPages.page === state.addTopicPages.pages.length - 1,
                    },
                ],
            },
        ];

        const index = Number(input);
        let topic = topicsExistInDB[Number(index) - 1];

        if (Number.isNaN(index)) {
            topic = input;
        } else {
            if (!topicsExistInDB[index - 1] || index <= 0 || index > topicsExistInDB.length) {
                await interaction.reply({
                    content: `I couldn't find a topic at index **${index}**`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
        }

        await ctx.services.settings.removeTopics<SetTopicOptions>({
            guildId,
            key: 'Topics',
            topics: topic,
        });

        const updatedTopics = await ctx.services.settings.getTopics<string>(guildId, 'Topics');

        await interaction.reply({
            content: `I've removed **${topic}** from the topics list.`,
            embeds: [
                {
                    thumbnail: { url: interaction.guild.iconURL() ?? '' },
                    title: 'Current Topics in Configuration',
                    description:
                        state.addTopicPages.pages[state.addTopicPages.page]
                            .map(
                                (string, i) =>
                                    `**${state.addTopicPages.page * 10 + i + 1}.** *${string}*`,
                            )
                            .join('\n') || 'No topics',
                    footer: {
                        text: `Page: ${state.addTopicPages.page + 1}/${state.addTopicPages.pages.length} • Total Topics: ${updatedTopics.length}`,
                    },
                    color: global.embedColor,
                },
            ],
            components,
            flags: MessageFlags.Ephemeral,
        });
    },

    autocomplete: async (ctx: Context, interaction) => {
        const query = interaction.options.getString('topic') || '';
        const filtered = (
            await ctx.services.settings.getTopics<string>(interaction.guildId!, 'Topics')
        )
            .filter((key: string) => key.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 25)
            .map((key) => ({ name: key as string, value: key as string }));

        await interaction.respond(filtered);
    },
});

export const commandOptions = {
    name: 'remove_topic',
    description: 'Remove a topic from the configuration',
    type: ApplicationCommandOptionType.SUB_COMMAND,
    options: [
        {
            name: 'topic',
            description: 'Provide either the index position or name of the topic to remove',
            type: ApplicationCommandOptionType.STRING,
            required: true,
            autocomplete: true,
        },
    ],
};
