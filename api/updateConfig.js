// API Endpoint to update file at config/config.json
const path = require("path");
const fs = require("fs");
const pm2 = require("pm2");

module.exports = (app) => {
    app.post("/update-config", (req, res) => {
        const config = req.body;

        const configPath = path.join(__dirname, "../config", "config.json");

        fs.writeFile(configPath, JSON.stringify(config, null, 2), (err) => {
            if (err) {
                console.error("Error writing config:", err);
                return res.status(500).send("Failed to write config");
            }

            pm2.connect((err) => {
                if (err) {
                    console.error("Error connecting to PM2:", err);
                    return res.status(500).send("Failed to restart bot");
                }

                pm2.restart("discord-bot", (err) => {
                    pm2.disconnect();
                    if (err) {
                        console.error("Error restarting bot:", err);
                        return res.status(500).send("Failed to restart bot");
                    }

                    console.log("Bot restarted successfully via PM2.");
                    res.status(200).send(
                        "Config updated and bot restarted successfully!"
                    );
                });
            });
            console.log("Config updated and written to file.");
        });
    });
};
