import { useState, useCallback } from "react";
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { aromaAPI, BulkUploadStatus, BulkValidationResponse, BulkUploadResponse } from "@/lib/api";

interface BulkDeviceUploadModalProps {
  onDevicesAdded?: () => void;
}

export function BulkDeviceUploadModal({ onDevicesAdded }: BulkDeviceUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<BulkUploadStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BulkValidationResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Load upload status when modal opens
  const loadUploadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await aromaAPI.getBulkUploadStatus();
      if (response.success && response.data) {
        setUploadStatus(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load upload status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading upload status:", error);
      toast({
        title: "Error",
        description: "Failed to load upload status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Download CSV template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await aromaAPI.downloadBulkTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'device_bulk_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Template Downloaded",
        description: "CSV template has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      
      if (uploadStatus && file.size > uploadStatus.max_file_size_mb * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `File size must be less than ${uploadStatus.max_file_size_mb}MB`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setValidationResult(null);
      setUploadResult(null);
    }
  };

  // Validate CSV file
  const handleValidateFile = async () => {
    if (!selectedFile) return;
    
    try {
      setIsValidating(true);
      const response = await aromaAPI.validateBulkUpload(selectedFile);
      if (response.success && response.data) {
        setValidationResult(response.data);
        if (response.data.valid) {
          toast({
            title: "Validation Successful",
            description: `File is valid with ${response.data.total_rows} rows`,
          });
        } else {
          toast({
            title: "Validation Failed",
            description: `Found ${response.data.errors.length} errors in the file`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Validation Error",
          description: response.error || "Failed to validate file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating file:", error);
      toast({
        title: "Error",
        description: "Failed to validate file",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Upload devices
  const handleUploadDevices = async () => {
    if (!selectedFile || !validationResult?.valid) return;
    
    try {
      setIsUploading(true);
      const response = await aromaAPI.uploadBulkDevices(selectedFile);
      if (response.success && response.data) {
        setUploadResult(response.data);
        
        if (response.data.failed === 0) {
          toast({
            title: "Upload Successful",
            description: `All ${response.data.successful} devices have been created successfully`,
          });
        } else {
          toast({
            title: "Partial Success",
            description: `${response.data.successful} devices created, ${response.data.failed} failed`,
            variant: "destructive",
          });
        }
        
        onDevicesAdded?.();
      } else {
        toast({
          title: "Upload Error",
          description: response.error || "Failed to upload devices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading devices:", error);
      toast({
        title: "Error",
        description: "Failed to upload devices",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setUploadResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      setOpen(open);
      if (open) {
        loadUploadStatus();
      } else {
        handleReset();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Bulk Device Upload</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Upload Status */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading upload status...</span>
            </div>
          ) : uploadStatus ? (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Upload Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={uploadStatus.bulk_upload_enabled ? "default" : "destructive"} className="ml-2">
                    {uploadStatus.bulk_upload_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Max File Size:</span>
                  <span className="ml-2 font-medium">{uploadStatus.max_file_size_mb}MB</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Supported Formats:</span>
                  <span className="ml-2 font-medium">{uploadStatus.supported_formats.join(", ")}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Required Fields:</h4>
                <div className="flex flex-wrap gap-2">
                  {uploadStatus.required_fields.map(field => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}

          {/* Template Download */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Step 1: Download Template</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download the CSV template with the correct format and sample data.
            </p>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
          </Card>

          {/* File Upload */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Step 2: Upload CSV File</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select CSV file or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: {uploadStatus?.max_file_size_mb || 10}MB
                  </p>
                </label>
              </div>
              
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Validation */}
          {selectedFile && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Step 3: Validate File</h3>
              <div className="space-y-4">
                <Button
                  onClick={handleValidateFile}
                  disabled={isValidating}
                  className="w-full sm:w-auto"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Validate CSV File
                </Button>
                
                {validationResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {validationResult.valid ? "File is valid" : "File has errors"}
                      </span>
                      <Badge variant={validationResult.valid ? "default" : "destructive"}>
                        {validationResult.total_rows} rows
                      </Badge>
                    </div>
                    
                    {validationResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-red-600">Errors:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {validationResult.errors.map((error, index) => (
                            <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-yellow-600">Warnings:</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {validationResult.warnings.map((warning, index) => (
                            <div key={index} className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Upload */}
          {validationResult?.valid && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Step 4: Upload Devices</h3>
              <div className="space-y-4">
                <Button
                  onClick={handleUploadDevices}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload {validationResult.total_rows} Devices
                </Button>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading devices...</span>
                      <span>Please wait</span>
                    </div>
                    <Progress value={undefined} className="w-full" />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Upload Results</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{uploadResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total Devices</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{uploadResult.successful}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
                
                {uploadResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-red-600">Failed Devices:</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="text-xs bg-red-50 p-3 rounded border-l-4 border-red-500">
                          <div className="font-medium">Row {error.row}: {error.device_data.deviceName}</div>
                          <div className="text-red-600 mt-1">{error.error}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline">
                    Upload Another File
                  </Button>
                  <Button onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
