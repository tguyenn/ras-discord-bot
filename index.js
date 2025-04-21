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
        let API_channelId = "882012752426725396"; // 1212829382419157003 = orders
	// 882012752426725396 = mod-commands
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

            let processed_channel_ID = "881744052289167412"; // 1362603477569769502 = processed-orders
// 881744052289167412 = moderator-only
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


// Function to read messages at 10 PM every day
async function readMessagesTime() {
    const targetChannelId = "1212829382419157003"; // Replace with the ID of the channel to read messages from

    // Check the time every minute
    setInterval(async () => {
        // Get the current time in CDT
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Chicago', // CDT timezone
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        });
        const [currentHour, currentMinute] = formatter.formatToParts(now)
            .filter(part => part.type === 'hour' || part.type === 'minute')
            .map(part => parseInt(part.value, 10));

        console.log(`[TIME] It is currently ${currentHour}:${currentMinute} CDT`)
        // Check if it's time
        // if (currentHour === 23 && currentMinute === 20) {
        if(true) { // test
            try {
                const channel = await client.channels.fetch(targetChannelId);
                if (!channel) {
                    console.error("Target channel not found or is not a text channel.");
                    return;
                }

                // Fetch the last 50 messages from the channel
                const messages = await channel.messages.fetch({ limit: 50 });

                let annieUnprocArr = [];
                let colinUnprocArr = [];
                let annieCount;
                let colinCount;

                messages.forEach(message => {

                    const annieTag = "365619835939455005";
                    const colinTag = "533956992272695297";

                    if((message.embeds.length > 0) && message.content.includes(annieTag)) {
                        annieCount++;
                        annieUnprocArr.push(message.embeds[0].footer?.text);
                    }
                        
                    if((message.embeds.length > 0) && message.content.includes(colinTag)) {
                        colinCount++;
                        colinUnprocArr.push(message.embeds[0].footer?.text);
                    }

                    console.log(`[${message.author.tag}]: ${message.content}`);
                });
                console.log(`Annie: ${annieCount}, Colin: ${colinCount}`);

                // print shame in order-discussion channel :(
                let discuss_channel_id = "1229492853739225088";
                const discuss_channel = await client.channels.fetch(discuss_channel_id);
                if (!discuss_channel) {
                    return res.status(404).send({ error: 'discuss_channel_id not found.' });
                }
                console.log(`Fetching GAS discord channel with ID: ${discuss_channel_id}`);
                if(annieCount > 0) {
                    let messageContent = `<@365619835939455005>, you have ${annieCount} unprocessed items:\n\n`;
                    annieUnprocArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discuss_channel.send(messageContent);
                }
                if(colinCount > 0) {
                    let messageContent = `<@533956992272695297>, you have ${colinCount} unprocessed items:\n\n`;
                    colinUnprocArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discuss_channel.send(messageContent);
                }

                // Add your custom logic to process the messages here
            } catch (error) {
                console.error("Error reading messages:", error);
            }
        }
    }, 60000); // Check every minute
}

// Call the function after the bot is ready
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
    readMessagesTime();
});