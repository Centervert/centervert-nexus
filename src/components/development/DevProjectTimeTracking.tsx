import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DevProjectTimeTrackingProps {
  projectId: string;
}

export const DevProjectTimeTracking = ({ projectId }: DevProjectTimeTrackingProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Time tracking coming soon...</p>
      </CardContent>
    </Card>
  );
};
