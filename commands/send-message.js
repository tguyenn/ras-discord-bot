// Imports
const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, Client } = require("discord.js");

/**
 * @param {Client} client - The Discord client instance.
 * @param {Object} config - The bot's configuration object.
 */
module.exports = (client, config) => {
    return {
        name: "send-message",
        category: "Admin",
        description: "Send a plaintext message to a channel",
        data: new SlashCommandBuilder()
            .setName("send-message")
            .setDescription("Send a plaintext message to a channel")
            .addStringOption((option) =>
                option
                    .setName("message")
                    .setDescription("The message content to send")
                    .setRequired(true)
            )
            .addChannelOption((option) =>
                option
                    .setName("channel")
                    .setDescription(
                        "The channel to send the message to (defaults to current channel)"
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
                const messageContent = interaction.options.getString("message");
                const targetChannel =
                    interaction.options.getChannel("channel") ||
                    interaction.channel;

                // Basic validation
                if (!messageContent) {
                    await interaction.editReply({
                        content: "Message content is required.",
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    // Send the message to the target channel
                    await targetChannel.send(messageContent);

                    // Confirm to the user
                    await interaction.editReply({
                        content: `Message successfully sent to <#${targetChannel.id}>`,
                        ephemeral: true,
                    });
                } catch (error) {
                    console.error("Error sending message:", error);
                    await interaction.editReply({
                        content: `Failed to send message: ${error.message}`,
                        ephemeral: true,
                    });
                }
            } catch (error) {
                console.error("Error executing send-message command:", error);

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
