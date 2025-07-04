import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

interface Seat {
  id: string;
  isBooked: boolean;
  userEmail?: string;
}

let seats: Seat[] = Array(50)
  .fill(null)
  .map((_, index) => ({
    id: `S${index + 1}`,
    isBooked: false,
  }));

interface BookingRequest {
  seatIds: string[];
  email: string;
  paymentDetails: {
    cardNumber: string;
    expiry: string;
    cvv: string;
  };
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware to validate email
const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Get available seats
app.get("/api/seats", (req: Request, res: Response) => {
  const availableSeats = seats.filter((seat) => !seat.isBooked);
  res.json({ seats: availableSeats });
});

// Book seats
app.post("/api/book", async (req: Request, res: Response) => {
  const { seatIds, email, paymentDetails }: BookingRequest = req.body;

  // Input validation
  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "Invalid or empty seat selection" });
  }

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  if (!paymentDetails || !paymentDetails.cardNumber) {
    return res.status(400).json({ error: "Invalid payment details" });
  }

  // Check seat availability
  const selectedSeats = seats.filter((seat) => seatIds.includes(seat.id));
  if (selectedSeats.some((seat) => seat.isBooked)) {
    return res.status(400).json({ error: "One or more seats already booked" });
  }

  // Mock payment processing
  try {
    // In a real app, integrate with payment gateway like Stripe
    const paymentSuccess = await mockProcessPayment(paymentDetails);
    if (!paymentSuccess) {
      return res.status(400).json({ error: "Payment failed" });
    }

    // Update seat status
    seats = seats.map((seat) =>
      seatIds.includes(seat.id)
        ? { ...seat, isBooked: true, userEmail: email }
        : seat
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
  // Simulate payment processing
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Basic card number validation (in real app, use payment gateway)
  if (paymentDetails.cardNumber.length < 12) {
    return false;
  }
  return true;
}

// Send confirmation email
async function sendConfirmationEmail(email: string, seatIds: string[]) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
