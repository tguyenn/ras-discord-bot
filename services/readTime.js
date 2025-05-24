// Function to read messages at 10 PM every day
module.exports = (client, config) => {
    const targetChannelId = config.ORDERS_CH_ID; // Replace with the ID of the channel to read messages from

    // Check the time every minute
    let intervalId = setInterval(async () => {
        try {
            // Get the current time in CDT
            const now = new Date();
            const formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: "America/Chicago", // CDT timezone
                hour: "numeric",
                minute: "numeric",
                hour12: false,
            });
            const [currentHour, currentMinute] = formatter
                .formatToParts(now)
                .filter(
                    (part) => part.type === "hour" || part.type === "minute"
                )
                .map((part) => parseInt(part.value, 10));

            console.log(
                `[TIME] It is currently ${currentHour}:${currentMinute} CDT`
            );
            if (currentHour === 23 && currentMinute === 0) {
                // if(true) { // test
                try {
                    const channel = await client.channels.fetch(
                        targetChannelId
                    );
                    if (!channel) {
                        console.error(
                            "Target channel not found or is not a text channel."
                        );
                        return;
                    }

                    // Fetch the last 50 messages from the channel
                    const messages = await channel.messages.fetch({
                        limit: 50,
                    });
                    const botMessages = [...messages.values()]
                        .filter(
                            (message) => message.author.id === client.user.id
                        )
                        .slice(0, 20);

                    let unprocAmazonArr = [];
                    let unprocNonAmazonArr = [];
                    let amazonCount = 0;
                    let nonAmazonCount = 0;

                    botMessages.forEach((message) => {
                        let numEmbeds = message.embeds.length;
                        if (
                            numEmbeds > 0 &&
                            message.content.includes(config.DISC_AMZ_ORDER_TAG)
                        ) {
                            amazonCount++;
                            unprocAmazonArr.push(
                                message.embeds[numEmbeds - 1].footer?.text
                            ); // push last embed"s footer text (tag) into arr
                        }
                        if (
                            numEmbeds > 0 &&
                            message.content.includes(
                                config.DISC_NON_AMZ_ORDER_TAG
                            )
                        ) {
                            nonAmazonCount++;
                            unprocNonAmazonArr.push(
                                message.embeds[numEmbeds - 1].footer?.text
                            );
                        }

                        console.log(
                            `[${message.author.tag}]: ${message.content}`
                        );
                    });
                    console.log(
                        `Amazon: ${amazonCount}, Non-Amazon: ${nonAmazonCount}`
                    );

                    // print shame in order-discussion channel :(
                    let discuss_channel_id = config.DISCUSSION_CH_ID;
                    const discuss_channel = await client.channels.fetch(
                        discuss_channel_id
                    );
                    if (!discuss_channel) {
                        return res
                            .status(404)
                            .send({ error: "discuss_channel_id not found." });
                    }
                    console.log(
                        `Fetching discussion discord channel with ID: ${discuss_channel_id}`
                    );
                    if (amazonCount > 0) {
                        let messageContent = `<@${config.DISC_AMZ_ORDER_TAG}>, you have ${amazonCount} unprocessed items:\n\n`;
                        unprocAmazonArr.forEach((item, index) => {
                            messageContent += `${index + 1}. ${item}\n`;
                        });
                        await discuss_channel.send(messageContent);
                    }
                    if (nonAmazonCount > 0) {
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
        } catch (error) {
            console.error("Error in readMessagesTime interval:", error);
        }
    }, 60000); // Check every minute

    process.on("SIGINT", () => {
        // clean up so no memory leaks
        clearInterval(intervalId);
        process.exit(0);
    });
};
