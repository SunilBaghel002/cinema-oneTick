import { useState } from 'react';
// import axios from 'axios';

interface BookingModalProps {
  seatId: string;
  price: number;
  onClose: () => void;
  onConfirm: (formData: { name: string; email: string; phone: string }) => void;
}

export default function BookingModal({ seatId, price, onClose, onConfirm }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Confirm Booking</h2>
          <p className="text-gray-600">Review your seat selection</p>
        </div>
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Selected Seat:</h3>
            <span className="bg-blue-700 text-white px-2 py-1 rounded text-sm">
              {seatId}
            </span>
          </div>
          <div className="flex justify-between items-center text-xl">
            <span className="font-bold text-blue-900">Total Amount:</span>
            <span className="font-bold text-blue-900">${price}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-blue-900 font-semibold">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-700"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-blue-900 font-semibold">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-700"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-blue-900 font-semibold">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-700"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Confirm & Pay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}