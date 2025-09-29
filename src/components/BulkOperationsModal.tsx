import { useState } from "react";
import { Upload, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface BulkOperationsModalProps {
  onBulkUpload: (data: Array<{ deviceId: string; name: string; location: string }>) => void;
}

export function BulkOperationsModal({ onBulkUpload }: BulkOperationsModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const processCsv = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      if (!headers.includes('deviceid') || !headers.includes('name') || !headers.includes('location')) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must have columns: deviceId, name, location",
          variant: "destructive",
        });
        return;
      }

      const devices = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const deviceIdIndex = headers.indexOf('deviceid');
        const nameIndex = headers.indexOf('name');
        const locationIndex = headers.indexOf('location');
        
        return {
          deviceId: values[deviceIdIndex] || '',
          name: values[nameIndex] || '',
          location: values[locationIndex] || 'unmapped',
        };
      }).filter(device => device.deviceId && device.name);

      onBulkUpload(devices);
      setFile(null);
      setOpen(false);

      toast({
        title: "Bulk Upload Complete",
        description: `${devices.length} devices imported successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Error processing CSV file",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = "deviceId,name,location\nDEV001,Sample Device 1,Location A\nDEV002,Sample Device 2,Location B\nDEV003,Sample Device 3,unmapped";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'device_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Operations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Device Operations</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            <TabsTrigger value="template">Download Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csvFile">Select CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Headers: deviceId, name, location</li>
                <li>Use "unmapped" for devices without location</li>
                <li>One device per row</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={processCsv} disabled={!file}>
                Import Devices
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="template" className="space-y-4">
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Download a CSV template with the correct format for bulk device import.
              </p>
              <Button onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}