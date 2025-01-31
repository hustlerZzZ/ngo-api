import morgan from "morgan";
import helmet from "helmet";
import express from "express";
import passport from "passport";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import userRoute from "./routes/userRoute";
import blogRoute from "./routes/blogRoute";
import storyRoute from "./routes/storyRoute";
import contactRoute from "./routes/contactRoute";
import volunteerRoute from "./routes/volunteerRoute";

const app = express();

// Allowing Cors
const corsConfig: CorsOptions = {
  origin: ["http://localhost:5173","https://hungertohope.org/"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsConfig));

// Parsing JSON, Cookie Parser
app.use(cookieParser());
app.use(express.json());

// Adding Security Headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Adding logging
app.use(morgan("dev"));

// Passport Middleware
app.use(passport.initialize());

// Rate Limiter
const limit = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, Please try again in an hour!",
});

app.use("/api", limit);

// API
app.use("/api/v1/user", userRoute);
app.use("/api/v1/blogs", blogRoute);
app.use("/api/v1/story", storyRoute);
app.use("/api/v1/contact", contactRoute);
app.use("/api/v1/volunteer", volunteerRoute);

// Serving images
app.use("/uploads", express.static("uploads"));

app.all("*", (req, res) => {
  res.status(404).json({
    status: "error",
    msg: "Route not defined!",
  });
});

app.listen(5000, () => {
  console.log("App listening on port 5000");
});
