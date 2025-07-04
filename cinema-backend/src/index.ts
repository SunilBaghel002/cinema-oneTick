import express, { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Seat Schema and Model
interface ISeat {
  seatId: string;
  row: string;
  column: number;
  status: 'available' | 'booked';
  category: 'gold' | 'silver';
  price: number;
  bookedBy?: {
    name: string;
    email: string;
    phone: string;
  };
}

const seatSchema = new Schema<ISeat>({
  seatId: { type: String, required: true, unique: true },
  row: { type: String, required: true },
  column: { type: Number, required: true },
  status: { type: String, enum: ['available', 'booked'], default: 'available' },
  category: { type: String, enum: ['gold', 'silver'], required: true },
  price: { type: Number, required: true },
  bookedBy: {
    name: String,
    email: String,
    phone: String,
  },
});

const Seat = mongoose.model<ISeat>('Seat', seatSchema);

// Email Utility
const sendBookingConfirmation = async (
  email: string,
  seatId: string,
  name: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Seat Booking Confirmation',
    html: `
      <h2>Booking Confirmation</h2>
      <p>Dear ${name},</p>
      <p>Your seat ${seatId} has been successfully booked!</p>
      <p>Thank you for choosing our service.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Initialize Seats Function
const initializeSeats = async (): Promise<void> => {
  try {
    // Clear outdated data with incorrect schema (e.g., id, isBooked)
    await Seat.deleteMany({ id: { $exists: true } });
    const existingSeats = await Seat.countDocuments();
    if (existingSeats > 0) {
      console.log('Seats already initialized, skipping initialization.');
      return;
    }

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const columns = [1, 2, 3, 4, 5, 6];
    const seats = [];

    for (let row of rows) {
      for (let col of columns) {
        const seatId = `${row}${col}`; // Generate seat ID (e.g., A1)
        const category = row <= 'E' ? 'gold' : 'silver';
        const price = row <= 'E' ? 15 : 10;
        seats.push({
          seatId,
          row,
          column: col,
          status: 'available',
          category,
          price,
        });
      }
    }

    await Seat.deleteMany({}); // Clear any existing seats
    await Seat.insertMany(seats);
    console.log('Seats initialized successfully');
  } catch (error) {
    console.error('Failed to initialize seats:', error);
  }
};

// Controllers
const initializeSeatsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    await initializeSeats();
    res.status(201).json({ message: 'Seats initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize seats' });
  }
};

const getSeats = async (req: Request, res: Response): Promise<void> => {
  try {
    const seats = await Seat.find();
    if (seats.length === 0) {
      await initializeSeats(); // Fallback: initialize if no seats found
      const newSeats = await Seat.find();
      res.json(newSeats);
      return;
    }
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};

const bookSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { seatId, name, email, phone } = req.body;
    const seat = await Seat.findOne({ seatId });

    if (!seat || seat.status === 'booked') {
      res.status(400).json({ error: 'Seat not available' });
      return;
    }

    seat.status = 'booked';
    seat.bookedBy = { name, email, phone };
    await seat.save();

    await sendBookingConfirmation(email, seatId, name);
    res.json({ message: 'Seat booked successfully', seat });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book seat' });
  }
};

// Routes
app.post('/api/seats/initialize', initializeSeatsEndpoint);
app.get('/api/seats', getSeats);
app.post('/api/seats/book', bookSeat);

// Database Connection and Server Start
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/seat-booking')
  .then(async () => {
    console.log('Connected to MongoDB');
    await initializeSeats(); // Initialize seats on server start
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });