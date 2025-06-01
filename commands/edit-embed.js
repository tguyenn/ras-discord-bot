// Imports
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, CommandInteraction, Client } = require("discord.js");

/**
 * @param {Client} client - The Discord client instance.
 * @param {Object} config - The bot's configuration object.
 */
module.exports = (client, config) => {
    return {
        name: "edit-embed",
        category: "Admin",
        description: "Edit an existing embed message",
        data: new SlashCommandBuilder()
            .setName("edit-embed")
            .setDescription("Edit an existing embed message")
            .addStringOption((option) =>
                option
                    .setName("message_id")
                    .setDescription(
                        "The ID of the message containing the embed to edit"
                    )
                    .setRequired(true)
            )
            .addChannelOption((option) =>
                option
                    .setName("channel")
                    .setDescription("The channel containing the message")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("title")
                    .setDescription(
                        "New title for the embed (leave empty to keep current)"
                    )
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("description")
                    .setDescription(
                        "New description for the embed (leave empty to keep current)"
                    )
                    .setRequired(false)
            )
            .addStringOption((option) =>
                option
                    .setName("color")
                    .setDescription(
                        "New color for the embed (hex code or basic color name)"
                    )
                    .setRequired(false)
            ),

        /**
         * Executes the slash command.
         * @param {null} message - Will be null for slash commands
         * @param {import('discord.js').CommandInteractionOptionResolver} args - The interaction options
         * @param {CommandInteraction} interaction - The interaction object representing the slash command.
         */
        async execute(message, args, interaction) {
            try {
                // Verify this is a slash command interaction
                if (!interaction) {
                    console.error(
                        "This command can only be used as a slash command."
                    );
                    return;
                }

                // Check if the user has permission
                if (interaction.user.id !== config.DISC_DEBUG_TAG) {
                    await interaction.reply({
                        content: `Sorry, only the debug user (<@${config.DISC_DEBUG_TAG}>) can use this command.`,
                        ephemeral: true,
                    });
                    return;
                }

                // Defer reply to avoid timeout
                await interaction.deferReply({ ephemeral: true });

                // Get command options
                const messageId = interaction.options.getString("message_id");
                const channel = interaction.options.getChannel("channel");
                const newTitle = interaction.options.getString("title");
                const newDescription =
                    interaction.options.getString("description");
                const newColor = interaction.options.getString("color");

                // Validate the channel type
                if (!channel.isText()) {
                    await interaction.editReply({
                        content:
                            "The specified channel must be a text channel.",
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    // Fetch the message
                    const targetMessage = await channel.messages
                        .fetch(messageId)
                        .catch(() => null);

                    if (!targetMessage) {
                        await interaction.editReply({
                            content: `Could not find a message with ID ${messageId} in the specified channel.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    // Check if the message has embeds
                    if (
                        !targetMessage.embeds ||
                        targetMessage.embeds.length === 0
                    ) {
                        await interaction.editReply({
                            content:
                                "The specified message does not contain any embeds.",
                            ephemeral: true,
                        });
                        return;
                    }

                    // Get the first embed from the message
                    const originalEmbed = targetMessage.embeds[0];

                    // Create a new embed based on the original
                    const updatedEmbed = new MessageEmbed(originalEmbed)
                        .setTitle(newTitle || originalEmbed.title)
                        .setDescription(
                            newDescription || originalEmbed.description
                        );

                    // Update color if provided
                    if (newColor) {
                        updatedEmbed.setColor(newColor);
                    }

                    // Update the timestamp
                    // updatedEmbed.setTimestamp().setFooter({
                    //     text: `Last edited by ${
                    //         interaction.user.tag
                    //     } on ${new Date().toLocaleString()}`,
                    //     iconURL: interaction.user.displayAvatarURL(),
                    // });

                    // Edit the message with the updated embed
                    await targetMessage.edit({ embeds: [updatedEmbed] });

                    // Send confirmation
                    await interaction.editReply({
                        content: `Embed successfully updated in <#${channel.id}>!`,
                        ephemeral: true,
                    });
                } catch (error) {
                    console.error("Error editing embed:", error);
                    await interaction.editReply({
                        content: `Failed to edit embed: ${error.message}`,
                        ephemeral: true,
                    });
                }
            } catch (error) {
                console.error("Error executing edit-embed command:", error);

                // Handle reply based on interaction state
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content:
                            "An error occurred while processing the command.",
                        ephemeral: true,
                    });
                } else if (interaction.deferred) {
                    await interaction.editReply({
                        content:
                            "An error occurred while processing the command.",
                    });
                }
            }
        },
    };
};
