import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactDialog } from "@/components/contacts/ContactDialog";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState("all"); // all or my
  const [viewFilter, setViewFilter] = useState("all"); // all, withCompany, withoutCompany
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ["companies-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const contactCounts = {
    all: 0,
    withCompany: 0,
    withoutCompany: 0,
    primary: 0,
  };

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">People</h1>
            <p className="text-sm text-muted-foreground">Individual human records across companies and prospects</p>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create person
          </Button>
        </div>

        <Tabs value={scope} onValueChange={setScope} className="w-full">
          <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              All People
            </TabsTrigger>
            <TabsTrigger
              value="my"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              My People
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          <Button
            variant={viewFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewFilter("all")}
          >
            All
          </Button>
          <Button
            variant={viewFilter === "withCompany" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewFilter("withCompany")}
          >
            With Company
          </Button>
          <Button
            variant={viewFilter === "withoutCompany" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewFilter("withoutCompany")}
          >
            Without Company
          </Button>
        </div>

        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ContactsTable searchQuery={searchQuery} viewFilter={viewFilter} scope={scope} />

        <ContactDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>
    </UnifiedLayout>
  );
};

export default Contacts;
