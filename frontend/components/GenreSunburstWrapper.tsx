'use client';
import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { GenreSunburst } from './GenreSunburst';
import { Spinner } from '@/components/ui/spinner';
import { proxyFetcher, transformGenreData } from '@/lib/utils';

// Define the type for genre data
interface GenreData {
  [key: string]: number;
}

export function GenreSunburstWrapper() {
  // Use state to track if proxy is needed
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [endpoint, setEndpoint] = useState<string>('/api/user/genres');

  // First try with the Next.js API route (prevents CORS)
  const { data, error, isLoading, mutate } = useSWR<GenreData>(
    endpoint,
    proxyFetcher,
    {
      onError: (err) => {
        // If this is the first attempt and it failed, try direct URL
        if (isFirstAttempt && endpoint === '/api/user/genres') {
          console.log('Trying direct backend URL for genres...', err);
          setIsFirstAttempt(false);
          setEndpoint('http://localhost:5000/api/user/genres');
          // This will trigger a new request with the updated URL
        }
      },
      revalidateOnFocus: false,
    }
  );
  
  // Effect to manually retry with different URL if needed
  useEffect(() => {
    if (endpoint !== '/api/user/genres' && !isFirstAttempt) {
      mutate(); // Trigger a refetch with new URL
    }
  }, [endpoint, isFirstAttempt, mutate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
        <span className="ml-2">Loading genre data...</span>
      </div>
    );
  }
  
  if (error) {
    console.error('Error fetching genre data:', error);
    return (
      <div className="text-red-500 flex flex-col items-center justify-center h-full">
        <p>Error loading genre data</p>
        <p className="text-sm mt-2">{error.message}</p>
        <button 
          onClick={() => mutate()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No genre data available
      </div>
    );
  }
  
  // Use the utility function to transform data
  const sunburstData = transformGenreData(data);

  return <GenreSunburst data={sunburstData} />;
}