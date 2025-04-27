// Imports
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, Client } = require('discord.js');

/**
 * @param {Client} client - The Discord client instance.
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('forceping')
        .setDescription('Ping bums that haven\'t placed orders!'),
    
    /**
     * Executes the slash command.
     * @param {CommandInteraction} interaction - The interaction object representing the slash command.
     */
    async execute(interaction) {
        const client = interaction.client;
        const targetChannelId = "1212829382419157003"; // Replace with the ID of the channel to read messages from

        try {
            const channel = await client.channels.fetch(targetChannelId);
            if (!channel || !channel.isTextBased()) {
                console.error("Target channel not found or is not a text channel.");
                await interaction.reply({ content: "Target channel not found or is not a text channel.", ephemeral: true });
                return;
            }

            // Fetch the last 50 messages from the channel
            const messages = await channel.messages.fetch({ limit: 50 });
            const botMessages = messages.filter(message => message.author.id === client.user.id).slice(0, 20);

            let annieUnprocArr = [];
            let colinUnprocArr = [];
            let annieCount = 0;
            let colinCount = 0;

            const annieTag = "365619835939455005";
            const colinTag = "533956992272695297";

            botMessages.forEach(message => {
                if ((message.embeds.length > 0) && message.content.includes(annieTag)) {
                    annieCount++;
                    annieUnprocArr.push(message.embeds[0].footer?.text);
                }

                if ((message.embeds.length > 0) && message.content.includes(colinTag)) {
                    colinCount++;
                    colinUnprocArr.push(message.embeds[0].footer?.text);
                }
            });

            console.log(`Annie: ${annieCount}, Colin: ${colinCount}`);

            // Print shame in order-discussion channel
            const discussChannelId = "1229492853739225088";
            const discussChannel = await client.channels.fetch(discussChannelId);
            if (!discussChannel || !discussChannel.isTextBased()) {
                console.error("Discussion channel not found or is not a text channel.");
                await interaction.reply({ content: "Discussion channel not found or is not a text channel.", ephemeral: true });
                return;
            }

            if (annieCount > 0) {
                let messageContent = `<@${annieTag}>, you have ${annieCount} unprocessed items:\n\n`;
                annieUnprocArr.forEach((item, index) => {
                    messageContent += `${index + 1}. ${item}\n`;
                });
                await discussChannel.send(messageContent);
            }

            if (colinCount > 0) {
                let messageContent = `<@${colinTag}>, you have ${colinCount} unprocessed items:\n\n`;
                colinUnprocArr.forEach((item, index) => {
                    messageContent += `${index + 1}. ${item}\n`;
                });
                await discussChannel.send(messageContent);
            }

            await interaction.reply({ content: "Force ping completed successfully!", ephemeral: true });
        } catch (error) {
            console.error("Error reading messages:", error);
            await interaction.reply({ content: "An error occurred while processing the command.", ephemeral: true });
        }
    }
};