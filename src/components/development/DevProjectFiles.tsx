import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DevProjectFilesProps {
  projectId: string;
}

export const DevProjectFiles = ({ projectId }: DevProjectFilesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Files & Attachments</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">File management coming soon...</p>
      </CardContent>
    </Card>
  );
};
