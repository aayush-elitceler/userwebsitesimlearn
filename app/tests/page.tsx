"use client"
import React, { useState } from 'react';

const mockTests = [
  {
    id: '1',
    name: 'Anxiety Test',
    description: 'Check your anxiety levels.',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=256&q=80',
    testStatus: 'COMPLETED',
  },
  {
    id: '2',
    name: 'Depression Test',
    description: 'Assess your mood and well-being.',
    image_url: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=256&q=80',
    testStatus: 'UNLOCKED',
  },
  {
    id: '3',
    name: 'Stress Test',
    description: 'Find out your stress level.',
    image_url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=256&q=80',
    testStatus: 'LOCKED',
  },
];


export default function TestsPage() {
  const userName = 'Alex';
  const [tests] = useState(mockTests);
  const completedCount = tests.filter(t => t.testStatus === 'COMPLETED').length;

  return (
    <div className="flex-1 max-w-[650px] font-sans mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-2 font-['Urbanist']">
        <span role="img" aria-label="wave">👋</span>{' '}
        Hey <span className="text-[#8B2D6C] font-bold font-['Urbanist']">{userName || 'there'}</span>, ready to check in with yourself today?
      </h2>
      {/* Progress Bar */}
      <div className="mb-6 font-sans">
        <div className="flex justify-between text-sm text-gray-500 mb-1 font-sans">
          <span>{completedCount} of {tests.length} completed</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#704180] to-[#8B2D6C]"
            style={{ width: `${tests.length ? (completedCount / tests.length) * 100 : 0}%` }}
          />
        </div>
      </div>
      {/* Test Cards */}
      <div className="flex flex-col gap-6  font-sans">
        {tests?.map((test) => (
          <div
            key={test.id}
            className={`rounded-3xl p-6 relative font-sans ${test.testStatus === 'COMPLETED'
                ? 'bg-gradient-to-r from-[#704180] to-[#8B2D6C]'
                : test.testStatus === 'UNLOCKED'
                  ? 'bg-gradient-to-r from-[#704180] to-[#8B2D6C] opacity-80'
                  : 'bg-gray-200 opacity-80'
              }`}
          >
            <div className="flex items-center gap-6 font-sans">
              <img src={test.image_url} alt={test.name} className="w-28 h-28 rounded-2xl object-cover" />
              <div>
                <h3 className={`text-xl font-bold font-sans ${test.testStatus === 'COMPLETED' ? 'text-white' : 'text-gray-300'}`}>{test.name}</h3>
                <p className={`text-base font-sans ${test.testStatus === 'COMPLETED' ? 'text-white' : 'text-gray-300'}`}>{test.description || 'No description available'}</p>
                <button
                  className={`mt-4 px-6 py-2 rounded-full font-semibold text-base font-sans
                    ${(test.testStatus === 'COMPLETED' || test.testStatus === 'UNLOCKED')
                      ? 'bg-white text-[#704180] hover:bg-gray-100'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  disabled={!(test.testStatus === 'COMPLETED' || test.testStatus === 'UNLOCKED')}
                >
                  Take test
                </button>
              </div>
            </div>
            {(test.testStatus !== 'COMPLETED' && test.testStatus !== 'UNLOCKED') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 rounded-3xl font-sans">
                <span className="text-white text-lg font-bold font-sans">
                  <span role="img" aria-label="lock">🔒</span> {test.testStatus === 'UNLOCKED' ? `Complete the ${test.name} to unlock` : 'Locked'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
