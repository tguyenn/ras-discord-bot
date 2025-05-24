// Interaction handling
module.exports = (client, config, Discord, axios) => {
    client.on("interactionCreate", async (interaction) => {
        try {
            // Handle slash commands
            if (interaction.isCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) {
                    console.error(
                        `No command matching ${interaction.commandName} was found.`
                    );
                    await interaction.reply({
                        content: "Command not found.",
                        ephemeral: true,
                    });
                    return;
                }

                // Execute the command
                await command.execute(interaction);
                return;
            }

            // Handle button interactions
            if (interaction.isButton()) {
                if (interaction.customId === "help_previous") {
                    await interaction.reply({
                        content: "You clicked the Previous button!",
                    });
                } else if (interaction.customId === "delete_button") {
                    if (
                        interaction.user.id === config.DISC_AMZ_ORDER_TAG ||
                        interaction.user.id === config.DISC_NON_AMZ_ORDER_TAG ||
                        interaction.user.id === config.DISC_DEBUG_TAG
                    ) {
                        console.log(
                            `Interaction triggered by the specific user: ${interaction.user.tag}`
                        );
                    } else {
                        console.log(
                            `Interaction triggered by another user: ${interaction.user.tag}`
                        );
                        await interaction.reply({
                            content: `<@${interaction.user.id}> not authorized to process order 😔`,
                            ephemeral: true,
                        });
                        return;
                    }

                    // Clone each embed from the original message
                    const embeds = interaction.message.embeds.map((embed) => {
                        return new Discord.MessageEmbed(embed); // Clone the embeds
                    });

                    const processed_channel_ID = config.PROCESSED_CH_ID; // processed-orders
                    const processed_channel = await client.channels.fetch(
                        processed_channel_ID
                    );
                    console.log(
                        `Fetching channel with ID: ${processed_channel_ID}`
                    );
                    if (!processed_channel) {
                        console.error("Processed channel not found.");
                        return;
                    }

                    let originalContent = interaction.message.content;
                    let strippedContent = originalContent
                        .split("\n")
                        .slice(1)
                        .join("\n"); // remove ping from message before reposting
                    await processed_channel.send({
                        content: strippedContent || "no message content oh no",
                        embeds: embeds,
                    });

                    // mark checkboxes in budget sheet
                    const numEmbeds = interaction.message.embeds.length;
                    const scriptURL = config.SCRIPT_API_URL;
                    const numItems =
                        interaction.message.embeds[0].title.split(" ")[0]; // grab number of items to process
                    const tag =
                        interaction.message.embeds[numEmbeds - 1].footer?.text; // grab tag from last embed
                    const committeeName =
                        interaction.message.embeds[0].fields[0].value;
                    const data = {
                        numItems: `${numItems}`,
                        tag: `${tag}`,
                        committeeName: `${committeeName}`,
                        action: "mark_checks",
                    };
                    console.log(
                        `sending numitems: ${numItems} tag: ${tag}, committee: ${committeeName}, action: mark_checks`
                    );
                    axios.post(scriptURL, data);

                    interaction.reply({
                        content: `${config.DISC_CONFIRM_REPLY_MSG} ${tag}`,
                        ephemeral: true,
                    });
                    await interaction.message.delete();
                } else if (interaction.customId == "fetch_amazon_ESL_forms") {
                    if (
                        interaction.user.id === config.DISC_AMZ_ORDER_TAG ||
                        interaction.user.id === config.DISC_DEBUG_TAG
                    ) {
                        console.log(
                            `Interaction triggered by the specific user: ${interaction.user.tag}`
                        );
                    } else {
                        console.log(
                            `Interaction triggered by another user: ${interaction.user.tag}`
                        );
                        await interaction.reply({
                            content: `<@${interaction.user.id}> not authorized to trigger Amazon search 😔`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const numEmbeds = interaction.message.embeds.length;
                    const tag =
                        interaction.message.embeds[numEmbeds - 1].footer?.text; // grab tag from last embed
                    const scriptURL = config.SCRIPT_API_URL;
                    quantities = [];

                    // get all item quantities from order message
                    const embeds = interaction.message.embeds;
                    for (const embed of embeds) {
                        if (embed.fields) {
                            for (const field of embed.fields) {
                                let firstWord = field.name.split(" ")[0];
                                let trimmed = firstWord.replaceAll("_", "");
                                let stringNum = trimmed.replace("x", "");
                                let num = parseInt(stringNum);
                                if (isNaN(num)) continue;
                                quantities.push(num);
                            }
                            console.log("sending quantities: ", quantities);
                        }
                    }

                    await interaction.deferReply({
                        content: "Waiting for GAS to finish...",
                        ephemeral: true,
                    }); // need this or else interaction will show as failed

                    const data = {
                        quantities: quantities,
                        action: "get_amazon_forms",
                    };
                    const response = await axios.post(scriptURL, data, {
                        timeout: 15000,
                    });
                    if (
                        response.data.success &&
                        response.data.data != undefined
                    ) {
                        const eslLinks = response.data.data; //lmfao
                        console.log("Returned array:", eslLinks);

                        let color = Number(tag);
                        if (isNaN(color) || color < 0 || color > 0xffffff)
                            color = 0xffffff;
                        console.log("color: " + color);
                        if (tag > 0xffffff) color = 0xffffff; // just incase ig
                        console.log(eslLinks.length);
                        for (let i = 0; i < eslLinks.length; i++) {
                            const embed = new Discord.MessageEmbed()
                                .setDescription(
                                    `[ESL Link ${i + 1}](${
                                        eslLinks[i]
                                    }) - tag ${tag}`
                                )
                                .setColor(color); // tag should be a valid color (hex or integer)
                            await interaction.followUp({
                                embeds: [embed],
                                ephemeral: true,
                            });
                            await new Promise((res) => setTimeout(res, 500)); // 500ms delay to avoid ratelimiting
                        }

                        await interaction.editReply({
                            content: "Finished Fetching👍",
                        });
                    } else {
                        await interaction.editReply({
                            content:
                                `someting broke (all emails likely not there yet. just do manually now sorry)😔: ${JSON.stringify(
                                    response.data,
                                    null,
                                    2
                                )}` || "fack it broke",
                        });
                        console.error("API call failed or returned no data.");
                        console.log(JSON.stringify(response.data, null, 2));
                    }
                }
            }
        } catch (error) {
            console.error("Error handling interaction:", error);
            if (interaction.isCommand() && !interaction.replied) {
                await interaction.reply({
                    content: "An error occurred while executing the command.",
                    ephemeral: true,
                });
            }
        }
    });
};
