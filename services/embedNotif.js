const { MessageEmbed } = require("discord.js");

/**
 * Send an embed to the discussion channel
 * @param {Discord.Client} client - The Discord client
 * @param {Object} config - The bot configuration
 * @param {string} title - The title of the embed
 * @param {string} color - The color of the embed (default: green for success, red for error)
 */
const sendEmbedNotification = async (client, config, title, color = "#00FF00") => {
    try {
        const discussionChannel = await client.channels.fetch(
            config.DISCUSSION_CH_ID
        );

        if (discussionChannel) {
            const embed = new MessageEmbed()
                .setTitle(title)
                .setColor(color)
                .setTimestamp();

            await discussionChannel.send({ embeds: [embed] });
        }
    } catch (embedError) {
        console.error("Error sending embed notification:", embedError);
    }
};

module.exports = sendEmbedNotification;