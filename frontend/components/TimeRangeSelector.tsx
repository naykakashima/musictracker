"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const options: { value: TimeRange; label: string }[] = [
    { value: 'short_term', label: '4 Weeks' },
    { value: 'medium_term', label: '6 Months' },
    { value: 'long_term', label: 'All Time' },
  ];

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-1 w-fit">
      {options.map((option) => (
        <div key={option.value} className="relative">
          <button
            onClick={() => onChange(option.value)}
            className={`relative z-10 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              value === option.value ? 'text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
          {value === option.value && (
            <motion.div
              layoutId="timeRangeIndicator"
              className="absolute inset-0 bg-indigo-500 rounded-md"
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}