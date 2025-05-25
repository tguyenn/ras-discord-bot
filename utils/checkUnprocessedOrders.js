/**
 * Utility module to check for unprocessed orders
 * @param {import('discord.js').Client} client - The Discord client
 * @param {Object} config - Configuration object
 * @param {boolean} notifyChannel - Whether to send notifications to the discussion channel
 * @param {import('discord.js').Interaction} [interaction] - Optional interaction object for slash command feedback
 * @returns {Promise<{amazonCount: number, nonAmazonCount: number, amazonItems: Array, nonAmazonItems: Array}>} - Results
 */
async function checkUnprocessedOrders(
    client,
    config,
    notifyChannel,
    interaction = null
) {
    try {
        const targetChannelId = config.ORDERS_CH_ID;
        const channel = await client.channels.fetch(targetChannelId);

        if (!channel) {
            console.error("Target channel not found or is not a text channel.");
            if (interaction)
                await interaction.reply({
                    content: "❌ Target channel not found.",
                    ephemeral: true,
                });
            return {
                amazonCount: 0,
                nonAmazonCount: 0,
                amazonItems: [],
                nonAmazonItems: [],
            };
        }

        // Fetch the last 50 messages from the channel
        const messages = await channel.messages.fetch({ limit: 50 });
        const botMessages = [...messages.values()]
            .filter((message) => message.author.id === client.user.id)
            .slice(0, 20);

        let unprocAmazonArr = [];
        let unprocNonAmazonArr = [];
        let amazonCount = 0;
        let nonAmazonCount = 0;

        botMessages.forEach((message) => {
            if (
                message.embeds.length > 0 &&
                message.content.includes(config.DISC_AMZ_ORDER_TAG)
            ) {
                amazonCount++;
                unprocAmazonArr.push(message.embeds[0].footer?.text);
            }

            if (
                message.embeds.length > 0 &&
                message.content.includes(config.DISC_NON_AMZ_ORDER_TAG)
            ) {
                nonAmazonCount++;
                unprocNonAmazonArr.push(message.embeds[0].footer?.text);
            }

            console.log(`[${message.author.tag}]: ${message.content}`);
        });

        console.log(`Amazon: ${amazonCount}, Non-Amazon: ${nonAmazonCount}`);

        // Send notifications if requested
        if (notifyChannel && (amazonCount > 0 || nonAmazonCount > 0)) {
            await sendNotifications(
                client,
                config,
                amazonCount,
                nonAmazonCount,
                unprocAmazonArr,
                unprocNonAmazonArr
            );
        } // If this is from an interaction, respond with a summary
        if (interaction) {
            const responseContent = `Found ${amazonCount} unprocessed Amazon orders and ${nonAmazonCount} unprocessed non-Amazon orders.${
                notifyChannel ? " Notifications sent." : ""
            }`;

            // Handle different interaction states
            if (interaction.deferred) {
                await interaction.editReply({ content: responseContent });
            } else if (!interaction.replied) {
                await interaction.reply({
                    content: responseContent,
                    ephemeral: true,
                });
            }
        }

        return {
            amazonCount,
            nonAmazonCount,
            amazonItems: unprocAmazonArr,
            nonAmazonItems: unprocNonAmazonArr,
        };
    } catch (error) {
        console.error("Error checking unprocessed orders:", error);

        if (interaction) {
            const errorMessage = "❌ Error checking unprocessed orders.";

            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else if (!interaction.replied) {
                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true,
                });
            }
        }

        return {
            amazonCount: 0,
            nonAmazonCount: 0,
            amazonItems: [],
            nonAmazonItems: [],
        };
    }
}

/**
 * Send notifications to the discussion channel
 * @param {import('discord.js').Client} client - The Discord client
 * @param {Object} config - Configuration object
 * @param {number} amazonCount - Number of unprocessed Amazon orders
 * @param {number} nonAmazonCount - Number of unprocessed non-Amazon orders
 * @param {Array} unprocAmazonArr - List of unprocessed Amazon orders
 * @param {Array} unprocNonAmazonArr - List of unprocessed non-Amazon orders
 */
async function sendNotifications(
    client,
    config,
    amazonCount,
    nonAmazonCount,
    unprocAmazonArr,
    unprocNonAmazonArr
) {
    try {
        const discussChannelId = config.DISCUSSION_CH_ID;
        const discussChannel = await client.channels.fetch(discussChannelId);

        if (!discussChannel) {
            console.error("Discussion channel not found.");
            return;
        }

        console.log(
            `Sending notifications to discussion channel with ID: ${discussChannelId}`
        );

        if (amazonCount > 0) {
            let messageContent = `<@${config.DISC_AMZ_ORDER_TAG}>, you have ${amazonCount} unprocessed items:\n\n`;
            unprocAmazonArr.forEach((item, index) => {
                messageContent += `${index + 1}. ${item}\n`;
            });
            await discussChannel.send(messageContent);
        }

        if (nonAmazonCount > 0) {
            let messageContent = `<@${config.DISC_NON_AMZ_ORDER_TAG}>, you have ${nonAmazonCount} unprocessed items:\n\n`;
            unprocNonAmazonArr.forEach((item, index) => {
                messageContent += `${index + 1}. ${item}\n`;
            });
            await discussChannel.send(messageContent);
        }
    } catch (error) {
        console.error("Error sending notifications:", error);
    }
}

module.exports = checkUnprocessedOrders;
