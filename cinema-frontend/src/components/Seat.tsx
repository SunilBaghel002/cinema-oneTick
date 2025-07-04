import { useState } from 'react';

interface SeatProps {
  seat: {
    seatId: string;
    status: 'available' | 'booked' | 'unavailable' | 'selected';
    category: 'gold' | 'silver';
    price: number;
    bookedBy?: { name: string; email: string; phone: string };
  };
  onSelect: (seatId: string) => void;
}

export default function Seat({ seat, onSelect }: SeatProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getSeatStyles = () => {
    switch (seat.status) {
      case 'available':
        return 'bg-blue-50 border-2 border-blue-300';
      case 'selected':
        return 'bg-blue-700 border-2 border-blue-800 text-white';
      case 'booked':
        return 'bg-red-400 border-2 border-red-500';
      case 'unavailable':
        return 'bg-gray-300 border-2 border-gray-400';
      default:
        return '';
    }
  };

  return (
    <div
      className={`w-10 h-10 rounded flex items-center justify-center text-sm m-1 cursor-pointer ${getSeatStyles()}`}
      onClick={() => seat.status === 'available' || seat.status === 'selected' ? onSelect(seat.seatId) : null}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {seat.seatId}
      {isHovered && seat.status === 'booked' && seat.bookedBy && (
        <div className="absolute z-10 bg-white p-2 rounded shadow-lg border border-blue-200 text-blue-900 text-xs">
          <p>Name: {seat.bookedBy.name}</p>
          <p>Phone: {seat.bookedBy.phone}</p>
        </div>
      )}
    </div>
  );
}