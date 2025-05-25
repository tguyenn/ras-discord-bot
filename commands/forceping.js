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
            )
        /**
         * Executes the slash command.
         * @param {null} message - Will be null for slash commands
         * @param {import('discord.js').CommandInteractionOptionResolver} args - The interaction options
         * @param {CommandInteraction} interaction - The interaction object representing the slash command.
         */,
        async execute(message, args, interaction) {
            // Double check to make sure we have a valid interaction object
            if (!interaction) {
                console.error("Interaction object is null or undefined.");
                return;
            }

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
        },
    };
};
