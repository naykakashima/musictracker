"use client";
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { proxyFetcher } from '@/lib/utils';

interface Artist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string; height: number; width: number }[];
  popularity: number;
  external_urls: { spotify: string };
}

interface SpotifyResponse {
  items: Artist[];
  total: number;
  limit: number;
  offset: number;
  previous: string | null;
  next: string | null;
  href: string;
}

export default function TopArtists({ 
  timeRange = 'medium_term',
  compact = false
}: { 
  timeRange?: 'short_term' | 'medium_term' | 'long_term',
  compact?: boolean
}) {
  // State to track if we need to use direct URL
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [endpoint, setEndpoint] = useState(`http://localhost:5000/api/user/artists?time_range=${timeRange}`);

  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useSWR<SpotifyResponse>(
    endpoint,
    proxyFetcher,
    {
      onError: (err) => {
        // If this is the first attempt and it failed, try direct URL
        if (isFirstAttempt) {
          console.log('Error fetching artist data, retrying...', err);
          setIsFirstAttempt(false);
          // This prevents infinite retry loops
          setTimeout(() => mutate(), 1000);
        }
      },
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
      // Use the time range as a key part to refetch when it changes
      refreshInterval: 0, // Don't auto-refresh
    }
  );

  // Update the endpoint when the time range changes
  useEffect(() => {
    setEndpoint(`http://localhost:5000/api/user/artists?time_range=${timeRange}`);
  }, [timeRange]);

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

  // Extract artist grid to a separate component for reuse
  const ArtistGrid = () => (
    <div className={compact ? 'p-0' : undefined}>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Show fewer skeletons in compact mode */}
          {Array(compact ? 3 : 9).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full mb-2" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-3 w-[80px] mt-1" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-red-500 mb-2">Error loading artists</div>
          <button 
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : (
        <motion.div 
          className={`grid gap-4 ${compact ? 'grid-cols-3 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}
          variants={container}
          initial="hidden"
          animate="show"
        >
          {!data?.items || data.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 col-span-3">
              No artists available for this time period
            </div>
          ) : (
            // Show only 3 artists in compact mode
            data.items.slice(0, compact ? 3 : undefined).map((artist) => (
              <motion.div 
                key={artist.id} 
                className="flex flex-col items-center text-center p-3 hover:bg-slate-100 rounded-lg transition-colors"
                variants={item}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <a 
                  href={artist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className={`relative ${compact ? 'w-20 h-20 md:w-24 md:h-24' : 'w-24 h-24 md:w-32 md:h-32'} mb-3`}>
                    {artist.images[0] ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={artist.images[0].url}
                          alt={artist.name}
                          fill
                          className="object-cover rounded-full"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                          <ExternalLink className="text-white" size={compact ? 18 : 24} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎵</span>
                      </div>
                    )}
                  </div>
                  <h3 className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>{artist.name}</h3>
                </a>
                {!compact && (
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {artist.genres.slice(0, 2).map((genre, idx) => (
                      <span 
                        key={idx} 
                        className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-700"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );

  // Now render with proper conditional structure
  if (compact) {
    return <ArtistGrid />;
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <CardTitle className="text-xl font-bold">Your Top Artists</CardTitle>
        <CardDescription>
          {timeRange === 'short_term' && 'Last 4 weeks'}
          {timeRange === 'medium_term' && 'Last 6 months'}
          {timeRange === 'long_term' && 'All time favorites'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ArtistGrid />
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
            href="https://open.spotify.com/collection/artists" 
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