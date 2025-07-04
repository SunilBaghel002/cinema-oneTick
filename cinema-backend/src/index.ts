import express, { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
async function connectDB() {
    try {
        const mongoUrl = process.env.MONGODB_URL;
        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }
        await mongoose.connect(mongoUrl);
        console.log("Successfully connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

// Define Seat interface without extending Document
interface Seat {
    id: string;
    isBooked: boolean;
    userEmail?: string;
}

// Define Mongoose Schema for Seat
const seatSchema = new mongoose.Schema<Seat>({
    id: { type: String, required: true, unique: true },
    isBooked: { type: Boolean, required: true, default: false },
    userEmail: { type: String, required: false },
});

const SeatModel = mongoose.model<Seat>("Seat", seatSchema);

// Initialize seats in MongoDB (run once or on startup if needed)
async function initializeSeats() {
    try {
        const existingSeats = await SeatModel.countDocuments();
        if (existingSeats === 0) {
            const seats: Seat[] = Array(50)
                .fill(null)
                .map((_, index) => ({
                    id: `S${index + 1}`,
                    isBooked: false,
                }));
            await SeatModel.insertMany(seats);
            console.log("Initialized 50 seats in MongoDB");
        }
    } catch (error) {
        console.error("Error initializing seats:", error);
    }
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Validate environment variables
function validateEnv() {
    const requiredVars = ["MONGODB_URL", "EMAIL_USER", "EMAIL_PASS"];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
    }
}

// Interface for Booking Request
interface BookingRequest {
    seatIds: string[];
    email: string;
    paymentDetails: {
        cardNumber: string;
        expiry: string;
        cvv: string;
    };
}

// Validate email
const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Get available seats
app.get("/api/seats", async (req: Request, res: Response): Promise<void> => {
    try {
        const availableSeats = await SeatModel.find({ isBooked: false });
        res.json({ seats: availableSeats });
    } catch (error) {
        console.error("Error fetching seats:", error);
        res.status(500).json({ error: "Failed to fetch seats" });
    }
});

// Book seats
app.post("/api/book", async (req: Request, res: Response): Promise<void> => {
    const { seatIds, email, paymentDetails }: BookingRequest = req.body;

    // Input validation
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        res.status(400).json({ error: "Invalid or empty seat selection" });
        return;
    }

    if (!email || !validateEmail(email)) {
        res.status(400).json({ error: "Invalid email address" });
        return;
    }

    if (!paymentDetails || !paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
        res.status(400).json({ error: "Invalid payment details" });
        return;
    }

    try {
        // Check seat availability
        const selectedSeats = await SeatModel.find({ id: { $in: seatIds } });
        if (selectedSeats.length !== seatIds.length) {
            res.status(400).json({ error: "One or more seats not found" });
            return;
        }
        if (selectedSeats.some((seat) => seat.isBooked)) {
            res.status(400).json({ error: "One or more seats already booked" });
            return;
        }

        // Mock payment processing
        const paymentSuccess = await mockProcessPayment(paymentDetails);
        if (!paymentSuccess) {
            res.status(400).json({ error: "Payment failed" });
            return;
        }

        // Update seat status in MongoDB
        await SeatModel.updateMany(
            { id: { $in: seatIds } },
            { $set: { isBooked: true, userEmail: email } }
        );

        // Send confirmation email
        await sendConfirmationEmail(email, seatIds);

        res.json({
            message: "Booking successful",
            bookedSeats: seatIds,
            email,
        });
    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Mock payment processing function
async function mockProcessPayment(paymentDetails: {
    cardNumber: string;
    expiry: string;
    cvv: string;
}): Promise<boolean> {
    try {
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Enhanced validation for payment details
        if (
            paymentDetails.cardNumber.length < 12 ||
            !/^\d{12,19}$/.test(paymentDetails.cardNumber) ||
            !/^\d{2}\/\d{2}$/.test(paymentDetails.expiry) ||
            !/^\d{3,4}$/.test(paymentDetails.cvv)
        ) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Payment processing error:", error);
        return false;
    }
}

// Send confirmation email
async function sendConfirmationEmail(email: string, seatIds: string[]) {
    try {
        await transporter.sendMail({
            from: `"Cinema Booking" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Booking Confirmation",
            html: `
                <h2>Booking Confirmation</h2>
                <p>Thank you for your booking!</p>
                <p>Booked Seats: ${seatIds.join(", ")}</p>
                <p>We'll see you at the event!</p>
            `,
        });
        console.log(`Confirmation email sent to ${email}`);
    } catch (error) {
        console.error("Email sending error:", error);
        throw new Error("Failed to send confirmation email");
    }
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Start server
async function startServer() {
    try {
        validateEnv();
        await connectDB();
        await initializeSeats();
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
    process.exit(1);
});

// Start the server
startServer();