import { Card, CardContent } from "@/components/ui/card";
import { Rocket } from "lucide-react";

interface ProjectReleasesTabProps {
  projectId: string;
}

export function ProjectReleasesTab({ projectId }: ProjectReleasesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Releases</h2>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Release tracking coming soon.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Track version releases and deployment history for this project.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
