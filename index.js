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
    const { content, embeds } = req.body;

    // Validate input
    if (!content && !embeds) {
        return res.status(400).send({ error: 'either content or embeds are required.' });
    }

    try {
        // Fetch the API_channel
        let API_channelId = "1212829382419157003"; // 1212829382419157003 = orders
        const API_channel = await client.channels.fetch(API_channelId);
        if (!API_channel) {
            return res.status(404).send({ error: 'API_Channel not found.' });
        }
        console.log(`Fetching GAS discord channel with ID: ${API_channelId}`);

        // Prepare the message payload
        const messagePayload = {};
        if (content) messagePayload.content = content;
        if (embeds) messagePayload.embeds = embeds;

        // Create buttons (optional)
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('help_previous')
                    .setLabel('Previous')
                    .setStyle('PRIMARY'),
                new Discord.MessageButton()
                    .setCustomId('delete_button')
                    .setLabel('explode button')
                    .setStyle('DANGER')
            );

        // Add buttons to the payload if needed
        messagePayload.components = [row];

        // Send the message
        await API_channel.send(messagePayload);
        return res.status(200).send({ success: true, message: 'Message sent successfully!' });
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
        } else if (interaction.customId === 'delete_button') {
            const originalEmbed = interaction.message.embeds[0];
            
            const newEmbed = new Discord.MessageEmbed()
            .setTitle(originalEmbed.title || 'No Title')
            .setDescription(originalEmbed.description || 'No Description')
            .setColor(originalEmbed.color || '#ffffff') // Default to white if no color is set
            .setFooter(originalEmbed.footer?.text || '', originalEmbed.footer?.iconURL || null)
            .setThumbnail(originalEmbed.thumbnail?.url || null)
            .setTimestamp(originalEmbed.timestamp || null);

            // Copy fields from the original embed
            if (originalEmbed.fields) {
                originalEmbed.fields.forEach(field => {
                    newEmbed.addField(field.name, field.value, field.inline);
                });
            }

            let processed_channel_ID = "1362603477569769502"; // 1362603477569769502 = processed-orders
            const processed_channel = await client.channels.fetch(processed_channel_ID);
            console.log(`Fetching channel with ID: ${processed_channel_ID}`);
            if (!processed_channel) {
                return res.status(404).send({ error: 'processed_channel not found.' });
            }

            await processed_channel.send({ embeds: [newEmbed] });
            
            let tag = originalEmbed.footer?.text;
            await interaction.reply({ content: `Successfully deleted order with tag (embed color): ${tag}`, ephemeral: true});
            await interaction.message.delete();

        }
    } catch (error) {
        console.error('Error handling button interaction:', error);
    }
});
