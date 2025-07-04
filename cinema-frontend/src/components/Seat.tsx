import React from 'react';
import { FaChair } from 'react-icons/fa';
import clsx from 'clsx';

interface SeatProps {
  seatNumber: number | string;
  status: 'available' | 'booked' | 'unavailable' | 'selected';
  onClick: () => void;
}

const Seat: React.FC<SeatProps> = ({status, onClick }) => {
  return (
    <button
      className={clsx(
        'w-10 h-10 m-1 rounded flex items-center justify-center border',
        {
          'bg-green-500 text-white': status === 'available',
          'bg-yellow-400 text-black': status === 'booked',
          'bg-gray-300 text-gray-500 cursor-not-allowed': status === 'unavailable',
          'bg-green-800 text-white': status === 'selected',
        }
      )}
      onClick={status !== 'unavailable' ? onClick : undefined}
    >
      <FaChair />
    </button>
  );
};

export default Seat;
