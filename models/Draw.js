const mongoose = require("mongoose");

const DrawSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: () => `Weekly Draw - ${new Date().toISOString().split("T")[0]}`,
        },
        startAt: {
            type: Date,
            default: Date.now,
        },
        nextDrawAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
        },
        price: {
            type: Number,
            default: 500,
        },
        status: {
            type: String,
            enum: ["open", "closed", "completed"],
            default: "open",
        },
        // ✅ Link to the winning ticket
        winnerTicket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            default: null,
        },
        // ✅ Link to the winning user
        winnerUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // ✅ Total tickets sold in this draw
        totalTickets: {
            type: Number,
            default: 0,
        },
        // ✅ Reward amount (e.g., 10000)
        rewardAmount: {
            type: Number,
            default: 10000,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Draw", DrawSchema);
