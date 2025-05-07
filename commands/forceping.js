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

            const targetChannelId = config.ORDERS_CH_ID; // Replace with the ID of the channel to read messages from

            try {
                const channel = await client.channels.fetch(targetChannelId);
                if (!channel) {
                    console.error("Target channel not found or is not a text channel.");
                    return;
                }

                // Fetch the last 50 messages from the channel
                const messages = await channel.messages.fetch({ limit: 50 });
                const botMessages = messages.filter(message => message.author.id === client.user.id).slice(0, 20);
                
                let unprocAmazonArr = [];
                let unprocNonAmazonArr = [];
                let amazonCount = 0;
                let nonAmazonCount = 0;

                botMessages.forEach(message => {

                    if((message.embeds.length > 0) && message.content.includes(config.DISC_AMZ_ORDER_TAG)) {
                        amazonCount++;
                        unprocAmazonArr.push(message.embeds[0].footer?.text);
                    }
                        
                    if((message.embeds.length > 0) && message.content.includes(config.DISC_NON_AMZ_ORDER_TAG)) {
                        nonAmazonCount++;
                        unprocNonAmazonArr.push(message.embeds[0].footer?.text);
                    }

                    console.log(`[${message.author.tag}]: ${message.content}`);
                });
                console.log(`Amazon: ${amazonCount}, Non-Amazon: ${nonAmazonCount}`);

                // print shame in order-discussion channel :(
                let discuss_channel_id = config.DISCUSSION_CH_ID;
                const discuss_channel = await client.channels.fetch(discuss_channel_id);
                if (!discuss_channel) {
                    return res.status(404).send({ error: 'discuss_channel_id not found.' });
                }
                console.log(`Fetching discussion discord channel with ID: ${discuss_channel_id}`);
                if(amazonCount > 0) {
                    let messageContent = `<@${config.DISC_AMZ_ORDER_TAG}>, you have ${amazonCount} unprocessed items:\n\n`;
                    unprocAmazonArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discuss_channel.send(messageContent);
                }
                if(nonAmazonCount > 0) {
                    let messageContent = `<@${config.DISC_NON_AMZ_ORDER_TAG}>, you have ${nonAmazonCount} unprocessed items:\n\n`;
                    unprocNonAmazonArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discuss_channel.send(messageContent);
                }

            } catch (error) {
                console.error("Error reading messages:", error);
            }
        }
    };
};
