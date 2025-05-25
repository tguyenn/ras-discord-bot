// Function to read messages at 11 PM every day
const checkUnprocessedOrders = require("../utils/checkUnprocessedOrders");

module.exports = (client, config) => {
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

            // Check if it's 11:00 PM (23:00)
            if (currentHour === 23 && currentMinute === 0) {
                console.log(
                    "It's 11:00 PM! Checking for unprocessed orders..."
                );

                // Use the shared functionality with notifyChannel=true and no interaction
                const results = await checkUnprocessedOrders(
                    client,
                    config,
                    true
                );
                console.log(
                    `Scheduled check completed. Found ${results.amazonCount} Amazon and ${results.nonAmazonCount} non-Amazon unprocessed orders.`
                );
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
