// Imports
const Discord = require("discord.js");
const hasPermission = require("./../utils/hasPermission");
const axios = require("axios");

module.exports = (client, config) => {
    var eventObj = {};

    // Settings
    eventObj.name = "interactionCreate"; // Event name
    eventObj.once = false; // Set this to true if it should listen once.

    // Main function
    /**
     *
     * @param {Discord.Interaction} interaction
     * @returns
     */
    eventObj.execute = async (interaction) => {
        try {
            // Handle button interactions
            if (interaction.isButton()) {
                return await handleButtonInteraction(
                    interaction,
                    client,
                    config
                );
            }

            // Handle slash commands
            if (!interaction.isCommand()) return;

            const command = client.commands.get(interaction.commandName);

            if (!command) return;
            if (
                command.permissions == null ||
                (command.permissions != null &&
                    hasPermission(interaction.member, command.permissions))
            )
                try {
                    // Check if the command has already been handled
                    if (!interaction.replied && !interaction.deferred) {
                        // Call execute with the correct parameter order - for slash commands, message should be null
                        await command.execute(
                            null,
                            interaction.options,
                            interaction
                        );
                    }
                } catch (err) {
                    if (err) console.error(err);
                }
        } catch (error) {
            console.error("Error in interactionCreate event:", error);
            // Try to send an error message if we can
            if (
                interaction.isRepliable() &&
                !interaction.replied &&
                !interaction.deferred
            ) {
                await interaction.reply({
                    content:
                        "An error occurred while processing this interaction.",
                    ephemeral: true,
                });
            } else if (interaction.deferred) {
                await interaction.editReply({
                    content:
                        "An error occurred while processing this interaction.",
                });
            }
        }
    };

    /**
     * Handle button interactions
     * @param {Discord.ButtonInteraction} interaction - The button interaction
     * @param {Discord.Client} client - The Discord client
     * @param {Object} config - Configuration object
     */
    async function handleButtonInteraction(interaction, client, config) {
        // Defer the reply to avoid interaction timeout
        await interaction.deferReply({ ephemeral: true });

        const customId = interaction.customId;

        // Process different buttons based on customId
        switch (customId) {
            case "delete_button":
                await handleDeleteButton(interaction, client, config);
                break;

            case "fetch_amazon_ESL_forms":
                await handleAmazonESLForms(interaction, client, config);
                break;

            case "help_previous":
                await handleHelpNavigation(interaction, "previous");
                break;

            case "help_next":
                await handleHelpNavigation(interaction, "next");
                break;

            default:
                await interaction.editReply({
                    content: `Unknown button: ${customId}. This interaction is not handled.`,
                    ephemeral: true,
                });
        }
    }
    /**
     * Handle the delete button (Explode) interaction
     * @param {Discord.ButtonInteraction} interaction
     * @param {Discord.Client} client
     * @param {Object} config
     */
    async function handleDeleteButton(interaction, client, config) {
        try {
            // Check if the user has permission to use this button
            // Only allow users with specific roles or IDs defined in config
            const allowedUsers = [
                config.DISC_AMZ_ORDER_TAG,
                config.DISC_NON_AMZ_ORDER_TAG,
                config.DISC_DEBUG_TAG,
            ];

            const userId = interaction.user.id;

            if (!allowedUsers.includes(userId)) {
                await interaction.editReply({
                    content: "You don't have permission to process this order.",
                    ephemeral: true,
                });
                return;
            }

            // Get the message that contains the button
            const message = interaction.message;

            // Send a copy of the message to the processed channel before deleting
            try {
                const processedChannelId = config.PROCESSED_CH_ID;
                const processedChannel = await client.channels.fetch(
                    processedChannelId
                );

                if (!processedChannel) {
                    console.error("Processed channel not found");
                } else {
                    // Create a copy of all embeds in the original message
                    const embeds = message.embeds.map(
                        (embed) => new Discord.MessageEmbed(embed)
                    );

                    // Extract the original message content and remove the first word (Discord tag)
                    let originalContent = message.content || "";
                    let contentWithoutFirstWord = originalContent;

                    // If there's content, split by spaces and remove the first element (tag)
                    if (originalContent.trim()) {
                        contentWithoutFirstWord = originalContent
                            .trim()
                            .split("\n")
                            .slice(1)
                            .join("\n"); // remove ping from message before reposting
                    }

                    // Prepare the new message content
                    const newMessageContent = `\n${contentWithoutFirstWord}`;

                    // Send to processed channel with modified content and original embeds
                    await processedChannel.send({
                        content: newMessageContent,
                        embeds: embeds,
                    });
                    console.log(
                        `Order copied to processed channel by ${interaction.user.tag}`
                    );

                    // Send data to Google Apps Script
                    try {
                        const numEmbeds = message.embeds.length;
                        const scriptURL = config.SCRIPT_API_URL;
                        const numItems = message.embeds[0].title.split(" ")[0]; // grab number of items to process
                        const tag = message.embeds[numEmbeds - 1].footer?.text; // grab tag from last embed
                        const committeeName = message.embeds[0].fields[0].value;
                        const data = {
                            numItems: `${numItems}`,
                            tag: `${tag}`,
                            committeeName: `${committeeName}`,
                            action: "mark_checks",
                        };

                        console.log(
                            `sending numitems: ${numItems} tag: ${tag}, committee: ${committeeName}, action: mark_checks`
                        );
                        await axios.post(scriptURL, data);
                        console.log(
                            "Successfully sent data to Google Apps Script"
                        );
                    } catch (scriptError) {
                        console.error(
                            "Error sending data to Google Apps Script:",
                            scriptError
                        );
                        // Continue with deletion even if the script request fails
                    }
                }
            } catch (err) {
                console.error("Error sending to processed channel:", err);
                // Continue with deletion even if copying fails
            }

            // Reply with the configured confirm message
            await interaction.editReply({
                content: config.DISC_CONFIRM_REPLY_MSG,
                ephemeral: true,
            });

            // If this message has a thread, delete it first
            if (message.hasThread) {
                const thread = message.thread;
                if (thread) await thread.delete();
            }

            // Delete the original message
            await message.delete();

            console.log(`Order deleted by ${interaction.user.tag}`);
        } catch (error) {
            console.error("Error handling delete button:", error);
            await interaction.editReply({
                content:
                    "Failed to delete the message. Please try again or contact an administrator.",
                ephemeral: true,
            });
        }
    }
    /**
     * Handle Amazon ESL Forms button
     * @param {Discord.ButtonInteraction} interaction
     * @param {Discord.Client} client
     * @param {Object} config
     */
    async function handleAmazonESLForms(interaction, client, config) {
        try {
            // Check user permissions
            if (
                interaction.user.id === config.DISC_AMZ_ORDER_TAG ||
                interaction.user.id === config.DISC_DEBUG_TAG
            ) {
                console.log(
                    `Interaction triggered by authorized user: ${interaction.user.tag}`
                );
            } else {
                console.log(
                    `Interaction triggered by unauthorized user: ${interaction.user.tag}`
                );
                await interaction.reply({
                    content: `<@${interaction.user.id}> not authorized to trigger Amazon search 😔`,
                    ephemeral: true,
                });
                return;
            }

            // Extract necessary information from the embeds
            const message = interaction.message;
            const numEmbeds = message.embeds.length;
            const tag = message.embeds[numEmbeds - 1].footer?.text; // grab tag from last embed

            if (!tag) {
                await interaction.reply({
                    content:
                        "Could not find the order reference in this message.",
                    ephemeral: true,
                });
                return;
            }

            const scriptURL = config.SCRIPT_API_URL;
            const quantities = [];

            // Get all item quantities from order message
            const embeds = message.embeds;
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
                }
            }

            console.log("sending quantities:", quantities);

            // Defer the reply to avoid interaction timeout
            await interaction.deferReply({
                content: "Waiting for Google Apps Script to finish...",
                ephemeral: true,
            });

            try {
                // Send request to Google Apps Script
                const data = {
                    quantities: quantities,
                    action: "get_amazon_forms",
                };
                const response = await axios.post(scriptURL, data, {
                    timeout: 15000,
                });

                if (response.data.success && response.data.data !== undefined) {
                    const eslLinks = response.data.data;
                    console.log("Returned array:", eslLinks);

                    // Calculate color from tag
                    let color = Number(tag);
                    if (isNaN(color) || color < 0 || color > 0xffffff)
                        color = 0xffffff;
                    console.log("color: " + color);

                    // Send embeds with ESL links
                    console.log(eslLinks.length);
                    for (let i = 0; i < eslLinks.length; i++) {
                        const embed = new Discord.MessageEmbed()
                            .setDescription(
                                `[ESL Link ${i + 1}](${
                                    eslLinks[i]
                                }) - tag ${tag}`
                            )
                            .setColor(color);
                        await interaction.followUp({
                            embeds: [embed],
                            ephemeral: true,
                        });
                        await new Promise((res) => setTimeout(res, 500)); // 500ms delay to avoid rate limiting
                    }

                    await interaction.editReply({
                        content: "Finished Fetching 👍",
                    });
                } else {
                    await interaction.editReply({
                        content:
                            `Something broke (all emails likely not there yet. just do manually now sorry)😔: ${JSON.stringify(
                                response.data,
                                null,
                                2
                            )}` || "Failed to retrieve ESL forms",
                    });
                    console.error("API call failed or returned no data.");
                    console.log(JSON.stringify(response.data, null, 2));
                }
            } catch (apiError) {
                console.error("Error calling API:", apiError);
                await interaction.editReply({
                    content:
                        "Failed to fetch Amazon ESL forms. The request timed out or the server is unavailable.",
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error("Error handling Amazon ESL forms button:", error);
            await interaction.editReply({
                content:
                    "Failed to fetch Amazon ESL forms. Please try again or contact an administrator.",
                ephemeral: true,
            });
        }
    }

    /**
     * Handle help navigation buttons (previous/next)
     * @param {Discord.ButtonInteraction} interaction
     * @param {string} direction - 'previous' or 'next'
     */
    async function handleHelpNavigation(interaction, direction) {
        try {
            // Get the current embed from the message
            const currentEmbed = interaction.message.embeds[0];

            // For demonstration, we're just updating the description to show navigation
            // In a real implementation, you would maintain page state and show different content
            const updatedEmbed = new Discord.MessageEmbed(
                currentEmbed
            ).setDescription(
                `Help page navigated: ${direction}\n\nThis is a placeholder for actual navigation functionality.`
            );

            // Update the message with the new embed
            await interaction.update({ embeds: [updatedEmbed] });
        } catch (error) {
            console.error(
                `Error handling ${direction} help navigation:`,
                error
            );
            await interaction.editReply({
                content: `Failed to navigate ${direction} in help menu.`,
                ephemeral: true,
            });
        }
    }

    return eventObj;
};
