const express = require("express")
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000;
const { connectDB } = require('./db');
const appRoutes =  require('./routes');

//MIDDLEWARES
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use('', appRoutes)



// ====== Rate Limiter ======
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,  // Disable the deprecated X-RateLimit-* headers
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
});

app.use(limiter); 






// Connect to MongoDB and start server
connectDB()
  .then(() => {
    console.log("✅ Database connected");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
})