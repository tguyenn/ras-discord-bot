// API Endpoint to update file at config/config.json
const path = require("path");
const fs = require("fs");
const pm2 = require("pm2");
const { MessageEmbed } = require("discord.js");

module.exports = (app, client, config) => {
    console.log("updateConfig module loaded and registering /update-config route");

    app.post("/update-config", async (req, res) => {
        const newConfig = req.body;

        const configPath = path.join(__dirname, "../config", "config.json");

        /**
         * Send an embed to the discussion channel
         * @param {string} title - The title of the embed
         * @param {string} color - The color of the embed (default: green for success, red for error)
         */
        const sendEmbedNotification = async (title, color = "#00FF00") => {
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

        try {
            // Write the config file
            await fs.promises.writeFile(
                configPath,
                JSON.stringify(newConfig, null, 2)
            );
            console.log("Config updated and written to file.");

            // Connect to PM2 and restart the bot
            await new Promise((resolve, reject) => {
                pm2.connect((err) => {
                    if (err) {
                        reject(
                            new Error(`PM2 connection failed: ${err.message}`)
                        );
                        return;
                    }

                    pm2.restart("discord-bot", (restartErr) => {
                        pm2.disconnect();
                        if (restartErr) {
                            reject(
                                new Error(
                                    `Bot restart failed: ${restartErr.message}`
                                )
                            );
                            return;
                        }

                        console.log("Bot restarted successfully via PM2.");
                        resolve();
                    });
                });
            });

            // Send success embed
            await sendEmbedNotification(
                "Successfully wrote script properties to Discord bot!"
            );

            // Send HTTP response
            res.status(200).send(
                "Config updated and bot restarted successfully!"
            );
        } catch (error) {
            console.error("Error updating config:", error);

            // Send error embed
            await sendEmbedNotification(
                `Error updating config: ${error.message}`,
                "#FF0000"
            );

            // Send HTTP error response
            res.status(500).send(`Failed to update config: ${error.message}`);
        }
    });
};
