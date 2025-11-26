import UnifiedLayout from "@/components/UnifiedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Contacts = () => {
  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage your client contacts</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contacts List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Contact management interface coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
};

export default Contacts;
