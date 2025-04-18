const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Sends a cat image!'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Fetch the image from the URL
            const response = await fetch('https://http.cat/200');
            if (!response.ok) throw new Error('Failed to fetch the image.');

            // Convert the response to a buffer
            const buffer = await response.buffer();

            // Create a button
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('another_cat')
                    .setLabel('Another Cat')
                    .setStyle(ButtonStyle.Primary)
            );

            // Send the image with the button
            await interaction.editReply({
                files: [{ attachment: buffer, name: 'cat.jpg' }],
                components: [row],
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Failed to fetch a cat image. Please try again later.');
        }
    },
};