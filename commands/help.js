// Imports

// Use destructuring to import only what is needed from discord.js
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = (client, config) => {
    const cmdObj = {};

    // Settings
    cmdObj.name = "help"; // The name of the command
    cmdObj.description = "tired of guessing? get help now!"; // A short description of what the command does
    cmdObj.category = "Helpful Commands"; // Which category the command belongs to
    cmdObj.permissions = null;
    cmdObj.data = new SlashCommandBuilder()
        .setName(cmdObj.name)
        .setDescription(cmdObj.description); // Build properties for a Slash Command here if wanted. If not, set the property to null

    // Main function

    /**
     * @param {import('discord.js').Message} message - Will be set if the command was executed by standard message command.
     * @param {Array<String> | import('discord.js').CommandInteractionOptionResolver} args - If the command was executed by standard message command, it will send an array of string arguments. If executed by slash commands it will return the interaction options.
     * @param {import('discord.js').CommandInteraction} interaction - Will be set if command was executed by a slash command.
     */
    cmdObj.execute = (message, args, interaction) => {
        // Creates the base of our embed message
        const embed = new MessageEmbed()
            .setTitle("Help Menu!")
            .setColor("#FF6700");

        // Add current PREFIX section if PREFIX is set
        if (config.PREFIX !== "") {
            embed.addField(
                "Current PREFIX",
                `The current PREFIX is: \`${config.PREFIX}\``,
                false
            );
        }

        // Looping through the collected categories to setup the help menu
        for (const [category, cmds] of Object.entries(
            client.commandCategories
        )) {
            let cmdStr = ``;
            for (var i = 0; i < cmds.length; i++) {
                cmdStr += `\`${cmds[i].name}\`: ${cmds[i].description}${
                    i == cmds.length - 1 ? "" : "\r\n"
                }`;
            }

            // Adds the category with the commands to embed message
            embed.addField(category, cmdStr, false);
        }

        // Create buttons
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("help_previous")
                .setLabel("Previous")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("help_next")
                .setLabel("Next")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setLabel("Visit Website")
                .setStyle("LINK")
                .setURL("https://example.com") // Replace with your website URL
        );

        // Check if the command is executed as a message or slash command
        if (message) {
            // Standard message command
            message.channel.send({ embeds: [embed], components: [row] });
            console.log("message found!");
        } else if (interaction) {
            // Slash command
            interaction.reply({ embeds: [embed], components: [row] });
        } else {
            console.error("Neither message nor interaction was provided.");
        }
    };

    return cmdObj;
};
