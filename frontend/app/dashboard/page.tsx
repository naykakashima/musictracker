// app/dashboard/page.tsx
import { GenreSunburstWrapper } from '@/components/analytics/GenreSunburstWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useSession } from '@/lib/useSession';
export default function Dashboard() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }
  return (
    <div className="container mx-auto p-4">
      <h1>Welcome, {session?.display_name}</h1>
    <Card>
      <CardHeader>
        <CardTitle>Your Genre Profile</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <GenreSunburstWrapper />
      </CardContent>
    </Card>
    </div>
  );
}