'use client';
import useSWR from 'swr';
import { GenreSunburst } from './GenreSunburst';
import { Spinner } from '@/components/ui/spinner';

export function GenreSunburstWrapper() {
  const { data, error, isLoading } = useSWR('/api/user/genres', async (url) => {
    const res = await fetch(`http://localhost:5000${url}`);
    return await res.json();
  });

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading genres</div>;

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