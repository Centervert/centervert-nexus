import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DevProjectSprintsProps {
  projectId: string;
}

export const DevProjectSprints = ({ projectId }: DevProjectSprintsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprints</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Sprint management coming soon...</p>
      </CardContent>
    </Card>
  );
};
