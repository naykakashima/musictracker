// app/dashboard/page.tsx
import { GenreSunburstWrapper } from '@/components/analytics/GenreSunburstWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function Dashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Genre Profile</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <GenreSunburstWrapper />
      </CardContent>
    </Card>
  );
}