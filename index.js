// API Endpoint to Send a Message
app.post('/send-message', async (req, res) => {
    const { API_channelId, content, embeds } = req.body;

    // Validate input
    if (!API_channelId || (!content && !embeds)) {
        return res.status(400).send({ error: 'API_channelId and either content or embeds are required.' });
    }

    try {
        // Fetch the API_channel
        const API_channel = client.channels.cache.get(API_channelId);
        if (!API_channel) {
            return res.status(404).send({ error: 'API_Channel not found.' });
        }

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