// Imports
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, Client } = require('discord.js');

/**
 * @param {Client} client - The Discord client instance.
 * @param {Object} config - The bot's configuration object.
 */
module.exports = (client, config) => {
    return {
        name: 'forceping',
        category: 'Utility', // Optional: Add a category if needed
        data: new SlashCommandBuilder()
            .setName('forceping')
            .setDescription('Ping bums that haven\'t placed orders!'),
        
        /**
         * Executes the slash command.
         * @param {CommandInteraction} interaction - The interaction object representing the slash command.
         */
        async execute(interaction) {
            if (!interaction) {
                console.error("Interaction object is null or undefined.");
                return;
            }

            const targetChannelId = "1365928612569677944"; // Replace with the ID of the channel to read messages from

            try {
                const channel = await client.channels.fetch(targetChannelId);
                if (!channel || channel.type !== 'GUILD_TEXT') { // Use 'GUILD_TEXT' for older versions
                    console.error("Target channel not found or is not a text channel.");
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: "Target channel not found or is not a text channel.", ephemeral: true });
                    }
                    return;
                }

                // Fetch the last 50 messages from the channel
                const messages = await channel.messages.fetch({ limit: 50 });
                const botMessages = Array.from(messages.values()) // Convert Collection to array
                    .filter(message => message.author.id === client.user.id)
                    .slice(0, 20);

                let annieUnprocArr = [];
                let colinUnprocArr = [];
                let annieCount = 0;
                let colinCount = 0;

                const config.DISC_AMZ_ORDER_TAG = "365619835939455005";
                const config.DISC_NON_AMZ_ORDER_TAG = "533956992272695297";

                botMessages.forEach(message => {
                    if ((message.embeds.length > 0) && message.content.includes(config.DISC_AMZ_ORDER_TAG)) {
                        annieCount++;
                        annieUnprocArr.push(message.embeds[0].footer?.text);
                    }

                    if ((message.embeds.length > 0) && message.content.includes(config.DISC_NON_AMZ_ORDER_TAG)) {
                        colinCount++;
                        colinUnprocArr.push(message.embeds[0].footer?.text);
                    }
                });

                console.log(`Annie: ${annieCount}, Colin: ${colinCount}`);

                // Print shame in order-discussion channel
                const discussChannelId = "1229492853739225088";
                const discussChannel = await client.channels.fetch(discussChannelId);
                if (!discussChannel || discussChannel.type !== 'GUILD_TEXT') { // Use 'GUILD_TEXT' for older versions
                    console.error("Discussion channel not found or is not a text channel.");
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: "Discussion channel not found or is not a text channel.", ephemeral: true });
                    }
                    return;
                }

                if (annieCount > 0) {
                    let messageContent = `<@${config.DISC_AMZ_ORDER_TAG}>, you have ${annieCount} unprocessed items:\n\n`;
                    annieUnprocArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discussChannel.send(messageContent);
                }

                if (colinCount > 0) {
                    let messageContent = `<@${config.DISC_NON_AMZ_ORDER_TAG}>, you have ${colinCount} unprocessed items:\n\n`;
                    colinUnprocArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discussChannel.send(messageContent);
                }

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "Force ping completed successfully!", ephemeral: true });
                }
            } catch (error) {
                console.error("Error reading messages:", error);
                if (interaction && !interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: "An error occurred while processing the command.", ephemeral: true });
                }
            }
        }
    };
};
