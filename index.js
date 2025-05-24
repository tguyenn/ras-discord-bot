// Load config and required packages
const config = require("./config/config.json");
const Discord = require("discord.js");
const axios = require("axios");

// Define required intents array
const intents = [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_BANS,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
    Discord.Intents.FLAGS.GUILD_WEBHOOKS,
    Discord.Intents.FLAGS.GUILD_INVITES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    Discord.Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
];

// Create Discord client with intents
const client = new Discord.Client({
    intents: intents,
});

// Start Discord bot
const { startBot } = require("./services/startBot");
startBot(client, config, Discord, axios);

// Start Express API
const startApi = require("./api/startApi");
startApi(client, config, Discord);

// Add error handling for the Discord client
client.on("error", (error) => {
    console.error("Discord client error:", error);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
    console.log("Received SIGINT signal. Shutting down gracefully...");

    // Close Discord connection
    if (client) {
        console.log("Logging out of Discord...");
        await client.destroy();
    }

    // Exit process
    console.log("Bot shutdown complete. Exiting...");
    process.exit(0);
});
