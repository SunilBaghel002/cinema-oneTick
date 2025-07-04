'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Seat from './components/Seat';
import BookingModal from './components/BookingModal';

interface SeatData {
  seatId: string;
  row: string;
  column: number;
  status: 'available' | 'booked';
  price: number;
  bookedBy?: { name: string; email: string; phone: string };
}

export default function Home() {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/seats?date=${selectedDate}`);
        console.log('Fetched seats:', response.data);
        if (response.data.length === 0) {
          setError('No seats found in the database.');
        } else {
          setSeats(response.data);
          setError(null);
        }
      } catch (error: any) {
        console.error('Failed to fetch seats:', error);
        setError('Failed to load seats. Ensure the backend is running at http://localhost:5000.');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedDate]);

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeat(seatId);
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8 text-navy">Seat Booking System</h1>

      <div className="flex justify-center mb-4">
        <div>
          <label className="block mb-1 text-navy">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <h3 className="text-lg font-semibold text-navy">Standard Seats ($12)</h3>
      </div>

      {loading && (
        <div className="text-center text-navy mb-4">Loading seats...</div>
      )}

      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}

      {!loading && !error && seats.length === 0 && (
        <div className="text-center text-navy mb-4">
          No seats available. Please check the backend.
        </div>
      )}

      <div className="flex justify-center">
        <div className="grid grid-cols-10 gap-2">
          {rows.map((row) => (
            <div key={row} className="flex gap-2">
              {columns.map((col) => {
                const seat = seats.find((s) => s.seatId === `${row}${col}`);
                return seat ? (
                  <Seat key={seat.seatId} seat={seat} onSelect={handleSeatSelect} />
                ) : (
                  <div
                    key={`${row}${col}`}
                    className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center text-navy text-sm"
                  >
                    {`${row}${col}`}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedSeat && (
        <BookingModal
          seatId={selectedSeat}
          price={seats.find((s) => s.seatId === selectedSeat)?.price || 12}
          bookingDate={selectedDate}
          onClose={() => setSelectedSeat(null)}
        />
      )}
    </main>
  );
}