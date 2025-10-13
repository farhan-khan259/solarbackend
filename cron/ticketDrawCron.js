const cron = require("node-cron");
const Ticket = require("../models/Ticket");

// 🎯 Weekly Lucky Draw - Runs every Sunday at midnight (00:00)
cron.schedule("0 0 * * 0", async () => {
    console.log("🎯 Running Weekly Lucky Draw...");

    try {
        // Fetch all pending tickets
        const pendingTickets = await Ticket.find({ status: "Pending" });

        if (pendingTickets.length === 0) {
            console.log("No pending tickets found this week. Skipping draw.");
            return;
        }

        // Pick a random winner
        const winnerIndex = Math.floor(Math.random() * pendingTickets.length);
        const winnerTicket = pendingTickets[winnerIndex];
        const drawDate = new Date();

        // Update all tickets: mark one as 'Win' and others as 'Lose'
        await Ticket.updateMany(
            { _id: { $in: pendingTickets.map((t) => t._id) } },
            [
                {
                    $set: {
                        status: {
                            $cond: [
                                { $eq: ["$ticketNumber", winnerTicket.ticketNumber] },
                                "Win",
                                "Lose",
                            ],
                        },
                        drawDate,
                    },
                },
            ]
        );

        console.log(
            `🏆 Weekly Draw Completed! Winner Ticket: ${winnerTicket.ticketNumber} | User ID: ${winnerTicket.userId}`
        );
    } catch (error) {
        console.error("❌ Error during weekly lucky draw:", error);
    }
});
