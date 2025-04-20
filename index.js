// Imports
const Discord = require('discord.js');
const express = require('express'); // Import Express
const bodyParser = require('body-parser'); // Import Body Parser for JSON parsing
const config = require('./config/config.json');

// Discord client
var intents = [
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
    Discord.Intents.FLAGS.GUILD_SCHEDULED_EVENTS
];
const client = new Discord.Client({ intents: [intents], disabledEveryone: true });

// Command collection
client.commands = new Discord.Collection();
client.slashCommands = [];
client.commandCategories = {}; // Object of command categories

// Load utils
const getAllFiles = require('./utils/getFileLocations');

// Load commands
console.log('Loading commands..');
var commands = getAllFiles(`${__dirname}/commands/`, '.js');
for (const command of commands) {
    var cmdFile = require(command)(client, config);
    console.log(`Loading ${cmdFile.name}..`);
    if (Boolean(cmdFile.category) && !client.commandCategories[cmdFile.category]) client.commandCategories[cmdFile.category] = [cmdFile];
    else if (Boolean(cmdFile.category) && client.commandCategories[cmdFile.category]) client.commandCategories[cmdFile.category] = [...client.commandCategories[cmdFile.category], cmdFile];
    else if (!Boolean(cmdFile.category) && !client.commandCategories[config.no_category_name]) client.commandCategories[config.no_category_name] = [cmdFile];
    else client.commandCategories[config.no_category_name] = [...client.commandCategories[config.no_category_name], cmdFile];
    if (cmdFile.data != null) client.slashCommands.push(cmdFile.data.toJSON());
    client.commands.set(cmdFile.name, cmdFile);
}
console.log(`${Array.from(client.commands.values()).length} command${Array.from(client.commands.values()).length > 1 || Array.from(client.commands.values()).length < 1 ? 's' : ''} was loaded!`);

//Loading events
console.log('Listening for events..');
var events = getAllFiles(`${__dirname}/events/`, '.js');
for (const event of events) {
    eventFile = require(event)(client, config);
    if (eventFile.once) client.once(eventFile.name, async (...args) => {
        try {
            await require(event)(client, config).execute(...args);
        } catch(err) {
            if (err) console.log(err);
        }
    });
    else client.on(eventFile.name, async (...args) => {
        try {
            await require(event)(client, config).execute(...args);
        } catch(err) {
            if (err) console.log(err);
        }
    });
    console.log(`Listening on '${eventFile.name}'..`);
}
console.log('Listening for all events now!');

// Logging into the bot
client.login(config.token);

// Express API Setup
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// API Endpoint to Send a Message
app.post('/send-message', async (req, res) => {
    const { channelId, message } = req.body;

    // Validate input
    if (!channelId || !message) {
        return res.status(400).send({ error: 'channelId and message are required.' });
    }

    try {
        // Fetch the channel
        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).send({ error: 'Channel not found.' });
        }

        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('help_previous')
                    .setLabel('Previous')
                    .setStyle('PRIMARY'),
                new Discord.MessageButton()
                    .setCustomId('help_next')
                    .setLabel('Next')
                    .setStyle('PRIMARY'),
                new Discord.MessageButton()
                    .setLabel('Visit Website')
                    .setStyle('LINK')
                    .setURL('https://example.com') // Replace with your website URL
            );
            

        // Send the message
        await channel.send({ content: message, components: [row] });
        return res.status(200).send({ success: true, message: 'Message sent successfully!'});
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).send({ error: 'Failed to send message.' });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});

// Interaction handling
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        if (interaction.customId === 'help_previous') {
            await interaction.reply({ content: 'You clicked the Previous button!' });
        } else if (interaction.customId === 'help_next') {
            await interaction.reply({ content: 'You clicked the Next button!' });
        } else {
            await interaction.reply({ content: 'Unknown button clicked.' });
        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
    }
});