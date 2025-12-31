const express = require("express");
const bodyParser = require("body-parser");

module.exports = (client, config, Discord) => {
    // Express API Setup
    const app = express();
    const PORT = 80;

    // Middleware
    app.use(bodyParser.json());

    // Register endpoints
    const sendMessage = require("./sendMessage");
    sendMessage(app, client, config, Discord);
    const updateConfig = require("./updateConfig");
    updateConfig(app, client, config);

    // Start the Express server
    app.listen(PORT, () => {
        console.log(`API server running on http://localhost:${PORT}`);
    });
};
