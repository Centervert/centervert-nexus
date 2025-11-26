import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, Search, FileText } from "lucide-react";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { generateCSV } from "@/lib/exportUtils";

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [scope, setScope] = useState("all"); // all or my
  const [viewFilter, setViewFilter] = useState("all"); // all, withCompany, withoutCompany
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: contacts } = useQuery({
    queryKey: ["contacts-export"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          companies (
            name
          )
        `);
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const contactCounts = {
    all: contacts?.length || 0,
    withCompany: contacts?.filter((c) => c.companies).length || 0,
    withoutCompany: contacts?.filter((c) => !c.companies).length || 0,
    primary: contacts?.filter((c) => c.is_primary).length || 0,
  };

  const handleExport = () => {
    if (contacts) {
      const exportData = contacts.map((contact) => ({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        company: contact.companies?.name || "",
        is_primary: contact.is_primary,
      }));
      generateCSV(exportData, "contacts");
    }
  };

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-sm text-muted-foreground">{contactCounts.all} records</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Edit columns
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create contact
            </Button>
          </div>
        </div>

        <Tabs value={scope} onValueChange={setScope} className="w-full">
          <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              All Contacts
            </TabsTrigger>
            <TabsTrigger
              value="my"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              My Contacts
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
