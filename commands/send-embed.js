// Imports
const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, CommandInteraction, Client } = require("discord.js");

/**
 * @param {Client} client - The Discord client instance.
 * @param {Object} config - The bot's configuration object.
 */
module.exports = (client, config) => {
    return {
        name: "send-embed",
        category: "Admin",
        description:
            "Create and send an embed with custom title and description",
        data: new SlashCommandBuilder()
            .setName("send-embed")
            .setDescription(
                "Create and send an embed with custom title and description"
            )
            .addStringOption((option) =>
                option
                    .setName("title")
                    .setDescription("The title of the embed")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("description")
                    .setDescription("The description of the embed")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("color")
                    .setDescription(
                        "The color of the embed (hex code or basic color name)"
                    )
                    .setRequired(false)
            )
            .addChannelOption((option) =>
                option
                    .setName("channel")
                    .setDescription(
                        "The channel to send the embed to (defaults to current channel)"
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
                const title = interaction.options.getString("title");
                const description =
                    interaction.options.getString("description");
                const color =
                    interaction.options.getString("color") || "#FF6700"; // Default to orange if not specified
                const targetChannel =
                    interaction.options.getChannel("channel") ||
                    interaction.channel;

                // Basic validation
                if (!title || !description) {
                    await interaction.editReply({
                        content: "Both title and description are required.",
                        ephemeral: true,
                    });
                    return;
                }

                try {
                    // Create the embed
                    const embed = new MessageEmbed()
                        .setTitle(title)
                        .setDescription(description)
                        .setColor(color);

                    // Send the embed to the target channel
                    await targetChannel.send({ embeds: [embed] });

                    // Confirm to the user
                    await interaction.editReply({
                        content: `Embed successfully sent to <#${targetChannel.id}>`,
                        ephemeral: true,
                    });
                } catch (error) {
                    console.error("Error sending embed:", error);
                    await interaction.editReply({
                        content: `Failed to send embed: ${error.message}`,
                        ephemeral: true,
                    });
                }
            } catch (error) {
                console.error("Error executing send-embed command:", error);

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
