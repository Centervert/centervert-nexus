import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DevProjectBuildsProps {
  projectId: string;
}

export const DevProjectBuilds = ({ projectId }: DevProjectBuildsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Builds & Deployments</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Build tracking coming soon...</p>
      </CardContent>
    </Card>
  );
};
