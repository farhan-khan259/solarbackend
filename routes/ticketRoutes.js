const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const {
    approveTicket,
    rejectTicket,
} = require("../controllers/ticketController");



// ✅ Admin Ticket Routes
router.get("/tickets", ticketController.getAllTickets);
router.post("/tickets/:id/approve", ticketController.approveTicket);
router.post("/tickets/:id/reject", ticketController.rejectTicket);
router.post("/draw", ticketController.runManualDraw);


router.post("/admin/tickets/:id/approve", approveTicket);
router.post("/admin/tickets/:id/reject", rejectTicket);

// 🔹 User routes
router.get("/tickets/random", ticketController.getRandomTickets);
router.post("/tickets/buy", ticketController.buyTicket);
router.get("/tickets/user/:userId", ticketController.getUserTickets);
router.get("/tickets/history/:userId", ticketController.getTicketHistory);

// 🔹 Admin routes
router.get("/admin/tickets", ticketController.getAllTickets);
router.post("/admin/draw", ticketController.runManualDraw);

module.exports = router;
