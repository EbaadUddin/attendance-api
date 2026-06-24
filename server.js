// ================================
// Global Error Handlers
// ================================
process.on("uncaughtException", (err) => {
    console.error("========================================");
    console.error("UNCAUGHT EXCEPTION");
    console.error(err);
    console.error(err.stack);
    console.error("========================================");
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("========================================");
    console.error("UNHANDLED REJECTION");
    console.error(reason);
    if (reason && reason.stack) {
        console.error(reason.stack);
    }
    console.error("========================================");
});

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const punchRoutes = require("./routes/punchRoutes");

const app = express();

// ================================
// Middlewares
// ================================
app.use(express.json());

app.use(helmet());

app.use(cors());

app.use(morgan("combined"));

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100
});

app.use(limiter);

// ================================
// Routes
// ================================
app.use("/api", punchRoutes);

// Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Attendance API Running"
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Not Found"
    });
});

// ================================
// Express Error Handler
// ================================
app.use((err, req, res, next) => {
    console.error("========================================");
    console.error("EXPRESS ERROR");
    console.error(err);
    console.error(err.stack);
    console.error("========================================");

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

// ================================
// Start Server
// ================================
const PORT = 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Running On Port ${PORT}`);
});

// Server Events
server.on("error", (err) => {
    console.error("========================================");
    console.error("SERVER ERROR");
    console.error(err);
    console.error(err.stack);
    console.error("========================================");
});

server.on("close", () => {
    console.log("Server Closed");
});

server.on("listening", () => {
    console.log("Server is listening...");
});