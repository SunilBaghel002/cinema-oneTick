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
interface IBooking {
  date: string; // ISO date string (e.g., "2025-07-04")
  bookedBy: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'booked';
}

interface ISeat {
  seatId: string;
  row: string;
  column: number;
  price: number;
  bookings: IBooking[];
}

const seatSchema = new Schema<ISeat>({
  seatId: { type: String, required: true, unique: true },
  row: { type: String, required: true },
  column: { type: Number, required: true },
  price: { type: Number, required: true },
  bookings: [
    {
      date: { type: String, required: true },
      bookedBy: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
      },
      status: { type: String, enum: ['booked'], default: 'booked' },
    },
  ],
});

const Seat = mongoose.model<ISeat>('Seat', seatSchema);

// Email Utility
const sendBookingConfirmation = async (
  email: string,
  seatId: string,
  name: string,
  bookingDate: string
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
      <p>Your seat ${seatId} has been successfully booked for ${bookingDate}!</p>
      <p>Thank you for choosing our service.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Initialize Seats Function
const initializeSeats = async (): Promise<void> => {
  try {
    // Clear outdated data
    await Seat.deleteMany({ $or: [{ id: { $exists: true } }, { category: { $exists: true } }] });
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
        seats.push({
          seatId,
          row,
          column: col,
          price: 12, // Standard category price
          bookings: [],
        });
      }
    }

    await Seat.deleteMany({});
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
    const { date } = req.query; // Date in YYYY-MM-DD format
    const targetDate = date ? date.toString() : new Date().toISOString().split('T')[0];
    const seats = await Seat.find();

    // Map seats to include status for the requested date
    const seatsWithStatus = seats.map((seat) => {
      const booking = seat.bookings.find((b) => b.date === targetDate);
      return {
        ...seat.toObject(),
        status: booking ? 'booked' : 'available',
        bookedBy: booking ? booking.bookedBy : null,
      };
    });

    if (seats.length === 0) {
      await initializeSeats();
      const newSeats = await Seat.find();
      const newSeatsWithStatus = newSeats.map((seat) => ({
        ...seat.toObject(),
        status: 'available',
        bookedBy: null,
      }));
      res.json(newSeatsWithStatus);
      return;
    }

    res.json(seatsWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};

const bookSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { seatId, name, email, phone, bookingDate } = req.body;
    if (!bookingDate) {
      res.status(400).json({ error: 'Booking date is required' });
      return;
    }

    const seat = await Seat.findOne({ seatId });
    if (!seat) {
      res.status(404).json({ error: 'Seat not found' });
      return;
    }

    // Check if seat is booked for the specified date
    const existingBooking = seat.bookings.find((b) => b.date === bookingDate);
    if (existingBooking) {
      res.status(400).json({ error: 'Seat is already booked for this date' });
      return;
    }

    // Add new booking
    seat.bookings.push({
      date: bookingDate,
      bookedBy: { name, email, phone },
      status: 'booked',
    });
    await seat.save();

    await sendBookingConfirmation(email, seatId, name, bookingDate);
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
    await initializeSeats();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });