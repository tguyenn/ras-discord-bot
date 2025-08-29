// API Endpoint to Send a Message
module.exports = (app, client, config, Discord) => {
    app.post("/send-message", async (req, res) => {
        const { content, embeds } = req.body;

        // Log the request body
        console.log("Request Body:", JSON.stringify(req.body, null, 2));

        // Log the content and embeds separately
        console.log("Content:", content);
        console.log("Embeds:", JSON.stringify(embeds, null, 2));

        // Validate input
        if (!content && !embeds) {
            return res
                .status(400)
                .send({ error: "either content or embeds are required." });
        }

        try {
            // Fetch the API_channel
            let API_channelId = config.ORDERS_CH_ID;
            const API_channel = await client.channels.fetch(API_channelId);
            if (!API_channel) {
                return res
                    .status(404)
                    .send({ error: "API_Channel not found." });
            }
            console.log(
                `Fetching GAS discord channel with ID: ${API_channelId}`
            );

            // Prepare the message payload
            const messagePayload = {};
            if (content) messagePayload.content = content;
            if (embeds) messagePayload.embeds = embeds;
            console.log("Copied GAS message payload!");
            // console.log(embeds);

            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageButton()
                    .setCustomId("place_button")
                    .setLabel(config.DISC_PLACE_BTN_MSG)
                    .setStyle("DANGER")
            );
            if (embeds[0].fields[3].value == "Amazon") {
                row.addComponents(
                    new Discord.MessageButton()
                        .setCustomId("fetch_amazon_ESL_forms")
                        .setLabel(config.DISC_AMAZON_BTN_MSG)
                        .setStyle("PRIMARY")
                );
            }
            messagePayload.components = [row];

            // Send the message
            await API_channel.send(messagePayload);
            console.log("Sent GAS message!");
            return res
                .status(200)
                .send({ success: true, message: "Message sent successfully!" });
        } catch (error) {
            console.error("Error sending message:", error);
            return res.status(500).send({ error: "Failed to send message." });
        }
    });
};
