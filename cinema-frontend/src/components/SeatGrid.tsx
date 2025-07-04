'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Seat from './Seat';
import BookingModal from './BookingModal';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';

interface SeatData {
  seatId: string;
  row: string;
  column: number;
  status: 'available' | 'booked' | 'unavailable' | 'selected';
  category: 'gold' | 'silver';
  price: number;
  bookedBy?: { name: string; email: string; phone: string };
}

export default function Home() {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const goldPrice = 15;
  const silverPrice = 10;
  // const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const goldRows = ['A', 'B', 'C', 'D', 'E'];
  const silverRows = ['F', 'G', 'H', 'I', 'J'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/seats');
        console.log('Fetched seats:', response.data);
        if (response.data.length === 0) {
          setError('No seats found in the database.');
        } else {
          const mappedSeats = response.data.map((seat: SeatData) => ({
            ...seat,
            status: seat.status === 'booked' ? 'booked' : 'available',
          }));
          setSeats(mappedSeats);
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
  }, []);

  const handleSeatSelect = (seatId: string) => {
    const seat = seats.find((s) => s.seatId === seatId);
    if (!seat || seat.status === 'unavailable' || seat.status === 'booked') return;

    if (seat.status === 'selected') {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatId === seatId ? { ...s, status: 'available' } : s
        )
      );
      setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
      setQuantities((prev) => {
        const newQuantities = { ...prev };
        delete newQuantities[seatId];
        return newQuantities;
      });
    } else {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatId === seatId ? { ...s, status: 'selected' } : s
        )
      );
      setSelectedSeats((prev) => (prev.includes(seatId) ? prev : [...prev, seatId]));
      if (!quantities[seatId]) {
        setQuantities((prev) => ({ ...prev, [seatId]: 1 }));
      }
    }
  };

  const handleQuantityChange = (seatId: string, change: number) => {
    setQuantities((prev) => {
      const newQuantity = Math.max(1, Math.min(5, (prev[seatId] || 1) + change));
      return { ...prev, [seatId]: newQuantity };
    });
  };

  const handleRemoveSeat = (seatId: string) => {
    setSeats((prev) =>
      prev.map((s) => (s.seatId === seatId ? { ...s, status: 'available' } : s))
    );
    setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
    setQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[seatId];
      return newQuantities;
    });
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find((s) => s.seatId === seatId);
      const quantity = quantities[seatId] || 1;
      return total + (seat ? seat.price * quantity : 0);
    }, 0);
  };

  const getTotalSeats = () => {
    return selectedSeats.reduce((total, seatId) => total + (quantities[seatId] || 1), 0);
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length > 0) {
      setShowBookingModal(true);
    }
  };

  const handleConfirmBooking = async (formData: { name: string; email: string; phone: string }) => {
    try {
      for (const seatId of selectedSeats) {
        const quantity = quantities[seatId] || 1;
        for (let i = 0; i < quantity; i++) {
          await axios.post('http://localhost:5000/api/seats/book', {
            seatId,
            ...formData,
          });
        }
      }
      setSeats((prev) =>
        prev.map((s) =>
          selectedSeats.includes(s.seatId)
            ? { ...s, status: 'booked', bookedBy: formData }
            : s
        )
      );
      setSelectedSeats([]);
      setQuantities({});
      setShowBookingModal(false);
    } catch (error) {
      console.error('Booking failed:', error);
      setError('Failed to book seats. Please try again.');
    }
  };

  const renderSeatSection = (sectionRows: string[], title: string, price: number) => {
    return (
      <div className="mb-8">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-blue-900 mb-2">{title}</h3>
          <p className="text-lg font-semibold text-blue-700">${price} per seat</p>
        </div>
        <div className="space-y-2">
          {sectionRows.map((row) => (
            <div key={row} className="flex justify-center items-center gap-2">
              <div className="w-8 text-center font-bold text-blue-900">{row}</div>
              <div className="flex">
                {columns.slice(0, 6).map((col) => {
                  const seatId = `${row}${col}`;
                  const seat = seats.find((s) => s.seatId === seatId);
                  return seat ? (
                    <Seat
                      key={seatId}
                      seat={seat}
                      onSelect={handleSeatSelect}
                    />
                  ) : (
                    <div
                      key={seatId}
                      className="w-10 h-10 bg-gray-300 border-2 border-gray-400 rounded flex items-center justify-center text-blue-900 text-sm m-1"
                    >
                      {seatId}
                    </div>
                  );
                })}
              </div>
              <div className="w-8"></div>
              <div className="flex">
                {columns.slice(6).map((col) => {
                  const seatId = `${row}${col}`;
                  const seat = seats.find((s) => s.seatId === seatId);
                  return seat ? (
                    <Seat
                      key={seatId}
                      seat={seat}
                      onSelect={handleSeatSelect}
                    />
                  ) : (
                    <div
                      key={seatId}
                      className="w-10 h-10 bg-gray-300 border-2 border-gray-400 rounded flex items-center justify-center text-blue-900 text-sm m-1"
                    >
                      {seatId}
                    </div>
                  );
                })}
              </div>
              <div className="w-8 text-center font-bold text-blue-900">{row}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-blue-50 rounded-lg">
      <div className="text-center mb-8">
        <div className="bg-blue-900 text-white py-3 px-8 rounded-lg inline-block mb-4">
          <h2 className="text-lg font-bold">🎬 SCREEN</h2>
        </div>
      </div>

      <div className="flex justify-center gap-6 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-700 border-2 border-blue-800 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 border-2 border-red-500 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>

      {loading && (
        <div className="text-center text-blue-900 mb-4">Loading seats...</div>
      )}
      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}
      {!loading && !error && seats.length === 0 && (
        <div className="text-center text-blue-900 mb-4">
          No seats available. Please check the backend.
        </div>
      )}

      {renderSeatSection(goldRows, '🏆 GOLD CLASS', goldPrice)}
      {renderSeatSection(silverRows, '🥈 SILVER CLASS', silverPrice)}

      <div className="flex justify-center items-center gap-2 mt-4">
        <div className="w-8"></div>
        <div className="flex">
          {columns.slice(0, 6).map((col) => (
            <div key={`left-${col}`} className="w-10 text-center text-sm font-bold text-blue-900 m-1">
              {col}
            </div>
          ))}
        </div>
        <div className="w-8"></div>
        <div className="flex">
          {columns.slice(6).map((col) => (
            <div key={`right-${col}`} className="w-10 text-center text-sm font-bold text-blue-900 m-1">
              {col}
            </div>
          ))}
        </div>
        <div className="w-8"></div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <ShoppingCart size={24} />
              Selected Seats ({getTotalSeats()})
            </h3>
            <button
              onClick={handleProceedToPayment}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
          <div className="space-y-3">
            {selectedSeats.map((seatId) => {
              const seat = seats.find((s) => s.seatId === seatId);
              const quantity = quantities[seatId] || 1;
              return (
                <div key={seatId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="bg-blue-700 text-white px-3 py-1 rounded font-bold">
                      {seatId}
                    </span>
                    <div>
                      <p className="font-semibold text-blue-900">
                        {seat?.category === 'gold' ? '🏆 Gold' : '🥈 Silver'} Class
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <button
                          onClick={() => handleQuantityChange(seatId, -1)}
                          className="bg-blue-100 text-blue-900 rounded-full p-1 hover:bg-blue-200"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-blue-900 min-w-8 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(seatId, 1)}
                          className="bg-blue-100 text-blue-900 rounded-full p-1 hover:bg-blue-200"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-900">
                      ${seat ? seat.price * quantity : 0}
                    </span>
                    <button
                      onClick={() => handleRemoveSeat(seatId)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-blue-900">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-900">${getTotalPrice()}</span>
            </div>
          </div>
        </div>
      )}

      {showBookingModal && (
        <BookingModal
          seatId={selectedSeats[0]}
          price={getTotalPrice()}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}