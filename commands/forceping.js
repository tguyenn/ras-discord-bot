// Imports
const { SlashCommandBuilder } = require("@discordjs/builders");
const { CommandInteraction, Client } = require("discord.js");
const checkUnprocessedOrders = require("../utils/checkUnprocessedOrders");

/**
 * @param {Client} client - The Discord client instance.
 * @param {Object} config - The bot's configuration object.
 */
module.exports = (client, config) => {
    return {
        name: "forceping",
        category: "Utility",
        data: new SlashCommandBuilder()
            .setName("forceping")
            .setDescription("Ping bums that haven't placed orders!")
            .addBooleanOption((option) =>
                option
                    .setName("notify")
                    .setDescription(
                        "Send notifications to the discussion channel"
                    )
                    .setRequired(false)
            ),

        /**
         * Executes the slash command.
         * @param {null} message - Will be null for slash commands
         * @param {import('discord.js').CommandInteractionOptionResolver} args - The interaction options
         * @param {CommandInteraction} interaction - The interaction object representing the slash command.
         */ async execute(message, args, interaction) {
            try {
                // Double check to make sure we have a valid interaction object
                if (!interaction) {
                    console.error("Interaction object is null or undefined.");
                    return;
                }

                // Acknowledge the command immediately to prevent timeout
                await interaction.deferReply({ ephemeral: true });

                // Get the notify option (default to true if not specified)
                const shouldNotify =
                    interaction.options.getBoolean("notify") ?? true;

                // Use the shared functionality
                await checkUnprocessedOrders(
                    client,
                    config,
                    shouldNotify,
                    interaction
                );
            } catch (error) {
                console.error("Error executing forceping command:", error);

                // Make sure we always respond to Discord
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
