const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const punchRoutes = require("./routes/punchRoutes");

const app = express();

app.use(express.json());

app.use(helmet());

app.use(cors());

app.use(morgan("combined"));

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100
});

app.use(limiter);

app.use("/api", punchRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API Not Found"
    });
});

app.listen(3001, () => {
    console.log("Server Running On Port 3000");
});