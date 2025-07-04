import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

async function connectDB() {
    try {
        const mongoUrl = process.env.MONGODB_URL;
        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }
        
        await mongoose.connect(mongoUrl, {
        });
        
        console.log("Successfully connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

app.get("/", (req: Request, res: Response) => {
    res.send("Hello from server");
});

async function startServer() {
    await connectDB();
    
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();