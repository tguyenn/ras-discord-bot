// API Endpoint to update file at config/config.json
const path = require("path");
const fs = require("fs");
const pm2 = require("pm2");
const sendEmbedNotification = require('../services/embedNotif');


module.exports = (app, client, config) => {
    app.post("/update-config", async (req, res) => {
        const newConfig = req.body;

        const configPath = path.join(__dirname, "../config", "config.json");

        try {
            // Write the config file
            await fs.promises.writeFile(
                configPath,
                JSON.stringify(newConfig, null, 2)
            );
            console.log("Config updated and written to file.");
            // Send success embed
            await sendEmbedNotification(
                client,
                config,
                "Successfully wrote script properties to Discord bot!"
            );

            // Send HTTP response
            res.status(200).send(
                "Bot config updated!"
            );

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
        } catch (error) {
            console.error("Error updating config:", error);

            // Send error embed
            await sendEmbedNotification(
                client,
                config,
                `Error updating config: ${error.message}`,
                "#FF0000"
            );

            // Send HTTP error response
            res.status(500).send(`Failed to update config: ${error.message}`);
        }
    });
};
