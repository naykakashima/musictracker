"use client";
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, Play, RefreshCw } from 'lucide-react';
import { proxyFetcher } from '@/lib/utils';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  external_urls: { spotify: string };
}

interface SpotifyResponse {
  items: Track[];
  total: number;
  limit: number;
  offset: number;
  previous: string | null;
  next: string | null;
  href: string;
}

export default function TopTracks({ 
  timeRange = 'medium_term',
  compact = false
}: { 
  timeRange?: 'short_term' | 'medium_term' | 'long_term',
  compact?: boolean
}) {
  // State to track if we need to use direct URL
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [endpoint, setEndpoint] = useState(`http://localhost:5000/api/user/tracks?time_range=${timeRange}`);

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<SpotifyResponse>(
    endpoint,
    proxyFetcher,
    {
      onError: (err) => {
        // If this is the first attempt and it failed, try direct URL
        if (isFirstAttempt) {
          console.log('Error fetching track data, retrying...', err);
          setIsFirstAttempt(false);
          // This prevents infinite retry loops
          setTimeout(() => mutate(), 1000);
        }
      },
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 0, // Don't auto-refresh
    }
  );

  // Update the endpoint when the time range changes
  useEffect(() => {
    setEndpoint(`http://localhost:5000/api/user/tracks?time_range=${timeRange}`);
  }, [timeRange]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Extract the track list content into a separate component
  const TrackList = () => (
    <div className={compact ? 'p-0' : undefined}>
      {isLoading ? (
        <div className="space-y-4">
          {/* Show fewer skeletons in compact mode */}
          {Array(compact ? 3 : 5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-red-500 mb-2">Error loading tracks</div>
          <button 
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : (
        <motion.div 
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {!data?.items || data.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tracks available for this time period
            </div>
          ) : (
            // Show only 5 tracks in compact mode
            data.items.slice(0, compact ? 5 : undefined).map((track, index) => (
              <motion.div 
                key={track.id} 
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                variants={item}
                whileHover={{ x: 4 }}
              >
                <div className="text-gray-400 font-mono w-6 text-center text-sm">
                  {index + 1}
                </div>
                <div className="relative min-w-[48px] h-12 overflow-hidden rounded-md">
                  {track.album.images[0] && (
                    <Image
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <a 
                      href={track.external_urls.spotify} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white"
                    >
                      <Play size={20} className="fill-white" />
                    </a>
                  </div>
                </div>
                <div className="flex-grow truncate">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {track.artists.map(a => a.name).join(', ')}
                  </p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDuration(track.duration_ms)}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );

  // Now render with proper conditional structure
  if (compact) {
    return <TrackList />;
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <CardTitle className="text-xl font-bold">Your Top Tracks</CardTitle>
        <CardDescription>
          {timeRange === 'short_term' && 'Last 4 weeks'}
          {timeRange === 'medium_term' && 'Last 6 months'}
          {timeRange === 'long_term' && 'All time favorite tracks'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <TrackList />
      </CardContent>
      <CardFooter className="bg-slate-50 py-3 px-4 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Based on your Spotify listening history
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => mutate()} 
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <a 
            href="https://open.spotify.com/collection/tracks" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Open in Spotify
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}