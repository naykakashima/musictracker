'use client';
import useSWR from 'swr';
import { GenreSunburst } from './GenreSunburst';


export function GenreSunburstWrapper() {
  const { data, error, isLoading } = useSWR('/api/user/genres', async (url) => {
    const res = await fetch(`/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            endpoint: url,
            method: 'GET',
            }),
    });
    return res;
  });
  if (error) {
    console.error('Error fetching genre data:', error);
    return <div>Error loading genre data</div>;
  } 

  // Transform API response to expected format
  const sunburstData = {
    name: 'genres',
    children: Object.entries(data).map(([name, value]) => ({
      name,
      value: Number(value),
    })),
  };

  return <GenreSunburst data={sunburstData} />;
}