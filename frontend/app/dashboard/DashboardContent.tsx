'use client'

import { useState } from 'react'
import { useSession } from '@/lib/useSession'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAudioFeaturesStats, useGenreStats, useLibraryStats } from "@/lib/stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenreSunburstWrapper } from '@/components/GenreSunburstWrapper'
import TopTracks from '@/components/TopTracks'
import TopArtists from '@/components/TopArtists'
import { TimeRangeSelector } from '@/components/TimeRangeSelector'
import { motion } from 'framer-motion'
import { Music, PieChart, BarChart3, Library, User, Radio } from 'lucide-react'

type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export function DashboardContent() {
  const { session, loading } = useSession()
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const { primaryFeature, isLoading: loadingAudioFeatures } = useAudioFeaturesStats(timeRange)
  const { topGenre, isLoading: loadingGenres } = useGenreStats(timeRange)
  const { savedTracks, isLoading: loadingLibrary } = useLibraryStats()
  if (loading) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Spinner />
        <p className="mt-4 text-slate-600">Loading your music profile...</p>
      </motion.div>
    )
  }

  if (!session) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <Music className="h-16 w-16 mx-auto mb-4 text-primary opacity-80" />
          <p className="text-lg mb-4">Please log in to view your dashboard</p>
          <a 
            href="/login" 
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition"
          >
            Log in with Spotify
          </a>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto p-4 pb-16 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
        <div>
          <motion.h1 
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome, {session.display_name}
          </motion.h1>
          <motion.p 
            className="text-muted-foreground mt-1"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Here is your personalized music dashboard
          </motion.p>
        </div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </motion.div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-3 h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tracks" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Top Tracks</span>
          </TabsTrigger>
          <TabsTrigger value="artists" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Top Artists</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* First Card: Audio Features */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Sound Profile</CardTitle>
                  <Radio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingAudioFeatures ? (
                    <div className="flex flex-col space-y-2">
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                      <div className="h-4 w-36 bg-gray-100 animate-pulse rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold capitalize">
                        {primaryFeature.feature === 'danceability' ? 'Danceable' : 
                         primaryFeature.feature === 'energy' ? 'Energetic' : 
                         primaryFeature.feature === 'acousticness' ? 'Acoustic' : 'Balanced'}
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="bg-gray-200 h-1.5 flex-grow rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${primaryFeature.value * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round(primaryFeature.value * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        based on audio feature analysis
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Second Card: Top Genre */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Top Genre</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingGenres ? (
                    <div className="flex flex-col space-y-2">
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                      <div className="h-4 w-36 bg-gray-100 animate-pulse rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold capitalize">
                        {topGenre}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        based on your top artists
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Third Card: Library Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Your Library</CardTitle>
                  <Library className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loadingLibrary ? (
                    <div className="flex flex-col space-y-2">
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                      <div className="h-4 w-36 bg-gray-100 animate-pulse rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        {savedTracks.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        tracks saved in your library
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Sections */}
                <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Genre Visualization */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
            <CardTitle>Your Genre Profile</CardTitle>
            <CardDescription>
              Visualization of your listening habits by genre
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            <GenreSunburstWrapper />
          </CardContent>
        </Card>

      {/* Top Tracks Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-sky-500/10">
          <div className="flex justify-between">
            <div>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription>
                Your most played songs
              </CardDescription>
            </div>
            <a 
              href="#tracks" 
              onClick={(e) => {
                e.preventDefault();
                (document.querySelector('[data-value="tracks"]') as HTMLElement)?.click();
              }}
              className="text-sm text-primary hover:underline"
            >
              View all
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <TopTracks timeRange={timeRange} compact />
        </CardContent>
      </Card>

  {/* Top Artists Preview */}
  <Card className="overflow-hidden lg:col-span-2">
    <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10">
      <div className="flex justify-between">
        <div>
          <CardTitle>Top Artists</CardTitle>
          <CardDescription>
            Your most listened artists
          </CardDescription>
        </div>
        <a 
          href="#artists" 
          onClick={(e) => {
            e.preventDefault();
            (document.querySelector('[data-value="artists"]') as HTMLElement)?.click();
          }}
          className="text-sm text-primary hover:underline"
        >
          View all
        </a>
      </div>
    </CardHeader>
    <CardContent className="p-4">
      <TopArtists timeRange={timeRange} compact />
    </CardContent>
  </Card>
</motion.div>
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="mt-6">
          <TopTracks timeRange={timeRange} />
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists" className="mt-6">
          <TopArtists timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}