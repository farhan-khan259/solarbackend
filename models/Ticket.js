const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        price: {
            type: Number,
            default: 500,
            min: 0,
        },
        status: {
            type: String,
            enum: ["Pending", "Win", "Lose"], // ✅ Consistent Title Case
            default: "Pending",
        },
        drawDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ ticketNumber: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Ticket", ticketSchema);


