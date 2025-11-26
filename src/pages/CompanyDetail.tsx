import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Globe, MapPin, Edit } from "lucide-react";
import { CompanyContacts } from "@/components/companies/CompanyContacts";
import { CompanyDialog } from "@/components/companies/CompanyDialog";
import { useState } from "react";

function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!company) {
    return (
      <UnifiedLayout>
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Company not found</p>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/companies")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {company.name}
              </h1>
              <Badge variant={company.is_active ? "default" : "secondary"}>
                {company.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Company
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold">Company Information</h2>
            <div className="space-y-3">
              {company.billing_email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Billing Email</p>
                    <p className="text-sm">{company.billing_email}</p>
                  </div>
                </div>
              )}
              {company.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-sm">{company.phone}</p>
                  </div>
                </div>
              )}
              {company.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
              )}
              {company.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-sm">{company.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {company.notes && (
            <div className="space-y-4 p-6 border rounded-lg bg-card">
              <h2 className="text-lg font-semibold">Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {company.notes}
              </p>
            </div>
          )}
        </div>

        <CompanyContacts companyId={id!} companyName={company.name} />

        <CompanyDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          company={company}
        />
      </div>
    </UnifiedLayout>
  );
}

export default CompanyDetail;
