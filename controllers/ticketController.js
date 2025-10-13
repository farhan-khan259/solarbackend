const Ticket = require("../models/Ticket");
const User = require("../models/User");

// 🔹 Helper: generate unique 6-digit ticket number
async function generateUniqueTicketNumber() {
    let ticket;
    let ticketNumber;
    do {
        ticketNumber = Math.floor(100000 + Math.random() * 900000).toString();
        ticket = await Ticket.findOne({ ticketNumber });
    } while (ticket);
    return ticketNumber;
}

// 🔹 Generate random 20 numbers (6-digit each)
exports.getRandomTickets = async (req, res) => {
    try {
        const tickets = [];
        for (let i = 0; i < 20; i++) {
            tickets.push(Math.floor(100000 + Math.random() * 900000).toString());
        }
        res.json({ tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating tickets" });
    }
};

// 🔹 Buy ticket
exports.buyTicket = async (req, res) => {
    try {
        const { userId, ticketNumber } = req.body;

        if (!userId || !ticketNumber)
            return res.status(400).json({ message: "Missing details" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // ✅ Check balance correctly
        if (user.userbalance < 500)
            return res.status(400).json({ message: "Insufficient balance" });

        // Check if ticket already exists
        const existing = await Ticket.findOne({ ticketNumber });
        if (existing)
            return res.status(400).json({ message: "Ticket already purchased" });

        // Deduct balance & save ticket
        user.userbalance -= 500;
        await user.save();

        const ticket = await Ticket.create({
            userId: user._id,
            ticketNumber,
            price: 500,
        });

        return res.status(200).json({
            success: true,
            message: "Ticket purchased successfully",
            ticket,
            userbalance: user.userbalance,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error buying ticket" });
    }
};


// 🔹 Get user’s bought tickets
exports.getUserTickets = async (req, res) => {
    try {
        const { userId } = req.params;
        const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });
        res.json({ tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching user tickets" });
    }
};

// 🔹 Ticket history
exports.getTicketHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 });

        const history = tickets.map((t) => ({
            ticketNumber: t.ticketNumber,
            price: t.price,
            status: t.status,
            drawDate: t.drawDate
                ? t.drawDate.toISOString().split("T")[0]
                : "Pending Draw",
            boughtOn: t.createdAt.toISOString().split("T")[0],
        }));

        res.json({ history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching history" });
    }
};



// 🔹 ADMIN: Get all tickets (with user info)
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .populate("userId", "fullName email whatsappNumber")
            .sort({ createdAt: -1 });

        res.json({ tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching all tickets" });
    }
};

// 🔹 ADMIN: Run manual draw
exports.runManualDraw = async (req, res) => {
    try {
        const pendingTickets = await Ticket.find({ status: "pending" });

        if (pendingTickets.length === 0) {
            return res.json({ message: "No pending tickets to draw." });
        }

        // Pick random winner
        const winner =
            pendingTickets[Math.floor(Math.random() * pendingTickets.length)];

        // Update all tickets
        for (const ticket of pendingTickets) {
            ticket.status = ticket.ticketNumber === winner.ticketNumber ? "won" : "lost";
            ticket.drawDate = new Date();
            await ticket.save();
        }

        // Reward winner
        const reward = 10000;
        const winnerUser = await User.findById(winner.userId);
        winnerUser.userbalance += reward;
        await winnerUser.save();

        res.json({
            message: "Draw completed successfully",
            winner: {
                ticketNumber: winner.ticketNumber,
                user: winnerUser.fullName,
                reward,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error running manual draw" });
    }
};


// // 🔹 ADMIN: Approve a ticket (mark as Win)


exports.approveTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // ✅ Make sure status matches your schema enum
        ticket.status = "Win"; // Use "Win" instead of "won"
        ticket.drawDate = new Date();

        await ticket.save();

        res.json({ success: true, message: "Ticket approved successfully!" });
    } catch (error) {
        console.error("❌ Error approving ticket:", error.message, error.stack);
        res.status(500).json({
            message: "Error approving ticket",
            error: error.message,
        });
    }
};

exports.rejectTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        ticket.status = "Lose"; // Use "Lose" (matches schema)
        ticket.drawDate = new Date();

        await ticket.save();

        res.json({ success: true, message: "Ticket rejected successfully!" });
    } catch (error) {
        console.error("❌ Error rejecting ticket:", error.message, error.stack);
        res.status(500).json({
            message: "Error rejecting ticket",
            error: error.message,
        });
    }
};
