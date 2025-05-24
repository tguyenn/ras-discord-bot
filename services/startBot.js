// Export the startBot function
module.exports = { startBot };

/**
 * Start the Discord bot
 * @param {Discord.Client} client - The Discord client instance
 * @param {Object} config - Configuration settings
 * @param {Object} Discord - Discord.js module
 * @param {Object} axios - Axios HTTP client
 */
function startBot(client, config, Discord, axios) {
    // No need to redefine intents or create client here as it's passed from index.js

    // Initialize interaction handlers
    const handleInteraction = require("./handleInteraction");
    handleInteraction(client, config, Discord, axios); // Initialize time-based message reading
    const readMessagesTime = require("./readTime"); // Command collection
    client.commands = new Discord.Collection();
    client.slashCommands = [];
    client.commandCategories = {}; // Object of command categories

    // Load utils
    const getAllFiles = require("../utils/getFileLocations");

    // Load commands
    console.log("Loading commands..");
    var commands = getAllFiles(`${__dirname}/../commands/`, ".js");
    for (const command of commands) {
        var cmdFile = require(command)(client, config);
        console.log(`Loading ${cmdFile.name}..`);
        if (
            Boolean(cmdFile.category) &&
            !client.commandCategories[cmdFile.category]
        )
            client.commandCategories[cmdFile.category] = [cmdFile];
        else if (
            Boolean(cmdFile.category) &&
            client.commandCategories[cmdFile.category]
        )
            client.commandCategories[cmdFile.category] = [
                ...client.commandCategories[cmdFile.category],
                cmdFile,
            ];
        else if (
            !Boolean(cmdFile.category) &&
            !client.commandCategories[config.NO_CATEGORY_NAME]
        )
            client.commandCategories[config.NO_CATEGORY_NAME] = [cmdFile];
        else
            client.commandCategories[config.NO_CATEGORY_NAME] = [
                ...client.commandCategories[config.NO_CATEGORY_NAME],
                cmdFile,
            ];
        if (cmdFile.data != null)
            client.slashCommands.push(cmdFile.data.toJSON());
        client.commands.set(cmdFile.name, cmdFile);
    }
    console.log(
        `${Array.from(client.commands.values()).length} command${
            Array.from(client.commands.values()).length > 1 ||
            Array.from(client.commands.values()).length < 1
                ? "s"
                : ""
        } was loaded!`
    );

    //Loading events
    console.log("Listening for events..");
    var events = getAllFiles(`${__dirname}/../events/`, ".js");
    for (const event of events) {
        let eventFile = require(event)(client, config);
        if (eventFile.once)
            client.once(eventFile.name, async (...args) => {
                try {
                    await eventFile.execute(...args);
                } catch (err) {
                    if (err) console.log(err);
                }
            });
        else
            client.on(eventFile.name, async (...args) => {
                try {
                    await eventFile.execute(...args);
                } catch (err) {
                    if (err) console.log(err);
                }
            });
        console.log(`Listening on "${eventFile.name}"..`);
    }
    console.log("Listening for all events now!");
    // Logging into the bot
    client
        .login(config.BOT_TOKEN)
        .then(() => {
            console.log("Login successful");
        })
        .catch((error) => {
            console.error("Login failed:", error);
        });

    // Add error event handlers for Discord client
    client.on("error", (error) => {
        console.error("Discord client error:", error);
    });

    client.on("disconnect", () => {
        console.log("Bot has been disconnected from Discord!");
    });

    // We don't need to add another ready event here, as it's already handled by events/ready.js
    // Just set up the readMessagesTime without additional calls to startApi
    readMessagesTime(client, config);
}
