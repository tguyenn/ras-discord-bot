// Imports
const Discord = require('discord.js');
const express = require('express'); // Import Express
const bodyParser = require('body-parser'); // Import Body Parser for JSON parsing
const config = require('./config/config.json');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
    else if (!Boolean(cmdFile.category) && !client.commandCategories[config.NO_CATEGORY_NAME]) client.commandCategories[config.NO_CATEGORY_NAME] = [cmdFile];
    else client.commandCategories[config.NO_CATEGORY_NAME] = [...client.commandCategories[config.NO_CATEGORY_NAME], cmdFile];
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
client.login(config.BOT_TOKEN);

// Express API Setup
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());


// API Endpoint to update file at config/config.json
app.post('/update-config', (req, res) => {
	const config = req.body;
  
	const configPath = path.join(__dirname, 'config', 'config.json');
  
	fs.writeFile(configPath, JSON.stringify(config, null, 2), (err) => {
	  if (err) {
		console.error('Error writing config:', err);
		return res.status(500).send('Failed to write config');
	  }
  
	  console.log('Config updated and written to file.');
	  res.sendStatus(200);
	});
});

// API Endpoint to Send a Message
app.post('/send-message', async (req, res) => {
    const { content, embeds } = req.body;

    // Log the request body
    console.log("Request Body:", JSON.stringify(req.body, null, 2));

    // Log the content and embeds separately
    console.log("Content:", content);
    console.log("Embeds:", JSON.stringify(embeds, null, 2));

    // Validate input
    if (!content && !embeds) {
        return res.status(400).send({ error: 'either content or embeds are required.' });
    }

    try {
        // Fetch the API_channel
        let API_channelId = config.ORDERS_CH_ID;
        const API_channel = await client.channels.fetch(API_channelId);
        if (!API_channel) {
            return res.status(404).send({ error: 'API_Channel not found.' });
        }
        console.log(`Fetching GAS discord channel with ID: ${API_channelId}`);

        // Prepare the message payload
        const messagePayload = {};
        if (content) messagePayload.content = content;
        if (embeds) messagePayload.embeds = embeds;
		console.log('Copied message payload!');
		// console.log(embeds);

        // Create buttons (optional)
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId('delete_button')
                    .setLabel(config.DISC_CONFIRM_BTN_MSG)
                    .setStyle('DANGER')
            );
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
    try {
        // Handle slash commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                await interaction.reply({ content: 'Command not found.', ephemeral: true });
                return;
            }

            // Execute the command
            await command.execute(interaction);
            return;
        }

        // Handle button interactions
        if (interaction.isButton()) {
            if (interaction.customId === 'help_previous') {
                await interaction.reply({ content: 'You clicked the Previous button!' });
            } else if (interaction.customId === 'delete_button') {

                if ((interaction.user.id === config.DISC_AMZ_ORDER_TAG) || (interaction.user.id === config.DISC_NON_AMZ_ORDER_TAG) || (interaction.user.id === config.DISC_DEBUG_TAG)) {
                    console.log(`Interaction triggered by the specific user: ${interaction.user.tag}`);
                } else {
                    console.log(`Interaction triggered by another user: ${interaction.user.tag}`);
                    await interaction.reply({ content: `<@${interaction.user.id}> not authorized to process order 😔`, ephemeral: true });
                    return;
                }

                const originalEmbed = interaction.message.embeds[0];
				const originalContent = interaction.message.content;

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

                const processed_channel_ID = config.PROCESSED_CH_ID; // processed-orders
                const processed_channel = await client.channels.fetch(processed_channel_ID);
                console.log(`Fetching channel with ID: ${processed_channel_ID}`);
                if (!processed_channel) {
                    console.error('Processed channel not found.');
                    return;
                }

				let strippedContent = originalContent.split(' ').slice(1).join(' '); // remove ping from message before reposting
                await processed_channel.send({ 
					content: strippedContent || 'no message content oh no',
					embeds: [newEmbed] 
				});

				// mark checkboxes in budget sheet
				// grab numItems and tag from embed
				const scriptURL = "https://script.google.com/macros/s/AKfycbyhxaNOacfgVzIkQDE8rUgzr6wEyYG-AzCt_DqcLRpTVY88478Y93uxJBQcHxNomPPm/exec";
				const numItems = originalEmbed.title.split(' ')[0]; // grab number of items to process			
                const tag = originalEmbed.footer?.text;
				const committeeName = originalEmbed.fields[0].value;
				const data = { numItems: `${numItems}`, tag: `${tag}`, committeeName: `${committeeName}`};
				console.log(`sending numitems: ${numItems} tag: ${tag}, committee: ${committeeName}`);
				try {
					const response = axios.post(scriptURL, data);
					console.log('Response:', response.data);
				} catch (error) {
					console.error('Error sending data to Google Sheet:', error);
				}

                interaction.reply({ content: config.DISC_CONFIRM_REPLY_MSG, ephemeral: true });
                await interaction.message.delete();
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (interaction.isCommand() && !interaction.replied) {
            await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
        }
    }
});


// Function to read messages at 10 PM every day
async function readMessagesTime() {
    const targetChannelId = config.ORDERS_CH_ID; // Replace with the ID of the channel to read messages from

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
        if (currentHour === 23 && currentMinute === 0) {
        // if(true) { // test
            try {
                const channel = await client.channels.fetch(targetChannelId);
                if (!channel) {
                    console.error("Target channel not found or is not a text channel.");
                    return;
                }

                // Fetch the last 50 messages from the channel
                const messages = await channel.messages.fetch({ limit: 50 });
                const botMessages = messages.filter(message => message.author.id === client.user.id).slice(0, 20);
                
                let unprocAmazonArr = [];
                let unprocNonAmazonArr = [];
                let amazonCount = 0;
                let nonAmazonCount = 0;

                botMessages.forEach(message => {

                    if((message.embeds.length > 0) && message.content.includes(config.DISC_AMZ_ORDER_TAG)) {
                        amazonCount++;
                        unprocAmazonArr.push(message.embeds[0].footer?.text);
                    }
                        
                    if((message.embeds.length > 0) && message.content.includes(config.DISC_NON_AMZ_ORDER_TAG)) {
                        nonAmazonCount++;
                        unprocNonAmazonArr.push(message.embeds[0].footer?.text);
                    }

                    console.log(`[${message.author.tag}]: ${message.content}`);
                });
                console.log(`Amazon: ${amazonCount}, Non-Amazon: ${nonAmazonCount}`);

                // print shame in order-discussion channel :(
                let discuss_channel_id = config.DISCUSSION_CH_ID;
                const discuss_channel = await client.channels.fetch(discuss_channel_id);
                if (!discuss_channel) {
                    return res.status(404).send({ error: 'discuss_channel_id not found.' });
                }
                console.log(`Fetching discussion discord channel with ID: ${discuss_channel_id}`);
                if(amazonCount > 0) {
                    let messageContent = `<@${config.DISC_AMZ_ORDER_TAG}>, you have ${amazonCount} unprocessed items:\n\n`;
                    unprocAmazonArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discuss_channel.send(messageContent);
                }
                if(nonAmazonCount > 0) {
                    let messageContent = `<@${config.DISC_NON_AMZ_ORDER_TAG}>, you have ${nonAmazonCount} unprocessed items:\n\n`;
                    unprocNonAmazonArr.forEach((item, index) => {
                        messageContent += `${index + 1}. ${item}\n`;
                    });
                    await discuss_channel.send(messageContent);
                }

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

