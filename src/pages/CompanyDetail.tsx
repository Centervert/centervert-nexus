import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { CompanyContacts } from "@/components/companies/CompanyContacts";
import { CompanyInfoCard } from "@/components/companies/CompanyInfoCard";

function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
        </div>

        <CompanyInfoCard company={company} />

        <CompanyContacts companyId={id!} companyName={company.name} />
      </div>
    </UnifiedLayout>
  );
}

export default CompanyDetail;
