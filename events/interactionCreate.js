const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            // Handle slash commands
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            // Handle button interactions
            if (interaction.customId === 'another_cat') {
                try {
                    await interaction.deferUpdate(); // Acknowledge the interaction

                    // Send a follow-up message
                    await interaction.followUp({ content: 'Here is another cat fact: Cats sleep for 70% of their lives!', ephemeral: true });
                } catch (error) {
                    console.error(error);

                    // Handle errors gracefully
                    if (!interaction.replied) {
                        await interaction.followUp({ content: 'Something went wrong. Please try again later.', ephemeral: true });
                    }
                }
            }
        }
    },
};