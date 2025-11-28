import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedLayout from "@/components/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload } from "lucide-react";
import { importOpportunitiesFromCSV, parseCSVFile } from "@/lib/importOpportunities";

export default function OpportunitiesImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const csvData = await parseCSVFile(file);
      const imported = await importOpportunitiesFromCSV(csvData);
      
      toast({
        title: "Import successful",
        description: `Imported ${imported.length} opportunities`,
      });
      
      navigate("/opportunities");
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import opportunities",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <UnifiedLayout>
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/opportunities")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Import Opportunities</h1>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Upload CSV File</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select your opportunities backup CSV file to import
            </p>
            
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              Selected: {file.name}
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full"
          >
            {isImporting ? (
              "Importing..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Opportunities
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-semibold">Import Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Old UUIDs will be ignored, new ones will be generated</li>
            <li>Status values will be mapped to current system</li>
            <li>Extra fields will be added to the Description</li>
            <li>Owner and creator IDs will be preserved if valid</li>
          </ul>
        </div>
      </div>
    </UnifiedLayout>
  );
}