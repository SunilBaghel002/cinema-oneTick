"use client"
import React, { useState } from 'react';
import Seat from './Seat';

type SeatStatus = 'available' | 'booked' | 'unavailable' | 'selected';

const initialSeatMap: SeatStatus[][] = [
  ['available', 'booked', 'booked', 'booked'],
  ['available', 'available', 'booked', 'available'],
  ['available', 'available', 'available', 'available'],
  ['booked', 'booked', 'unavailable', 'available'],
];

const SeatGrid: React.FC = () => {
  const [seatMap, setSeatMap] = useState<SeatStatus[][]>(initialSeatMap);

  const handleSeatClick = (rowIdx: number, colIdx: number) => {
    const current = seatMap[rowIdx][colIdx];
    if (current === 'unavailable' || current === 'booked') return;

    const updated = seatMap.map((row, rIdx) =>
      row.map((seat, cIdx) => {
        if (rIdx === rowIdx && cIdx === colIdx) {
          return seat === 'selected' ? 'available' : 'selected';
        }
        return seat;
      })
    );

    setSeatMap(updated);
  };

  return (
    <div className="flex flex-col items-center mt-6">
      {seatMap.map((row, rowIdx) => (
        <div key={rowIdx} className="flex">
          {row.map((status, colIdx) => (
            <Seat
              key={`${rowIdx}-${colIdx}`}
              seatNumber=""
              status={status}
              onClick={() => handleSeatClick(rowIdx, colIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SeatGrid;
