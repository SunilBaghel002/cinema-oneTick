import React from 'react';
import Head from 'next/head';
import SeatGrid from '../components/SeatGrid';

const HomePage = () => {
  return (
    <>
      <Head>
        <title className='text-black'>Seat Booking</title>
      </Head>
      <main className="min-h-screen bg-white p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">🎟 Seat Booking</h1>
        <SeatGrid />
      </main>
    </>
  );
};

export default HomePage;