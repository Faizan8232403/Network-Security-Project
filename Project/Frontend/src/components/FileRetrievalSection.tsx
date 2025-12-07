import { useState } from 'react';
import { Download, FileText, Search, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FileDetail {
  name: string;
  size: string;
}

export const FileRetrievalSection = () => {
  const [pin, setPin] = useState('');
  const [fileDetails, setFileDetails] = useState<FileDetail[]>([]);
  const [expiry, setExpiry] = useState('');
  const { toast } = useToast();

  // ------------------------------
  // HANDLE RETRIEVE FROM BACKEND
  // ------------------------------
  const handleRetrieve = async () => {
    if (!pin) {
      toast({
        title: "Enter a PIN",
        description: "Please enter a valid PIN to retrieve files",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/file/${pin}`);

      if (!res.ok) {
        throw new Error("Invalid or expired PIN");
      }

      const data = await res.json();

      if (!data.files || data.files.length === 0) {
        throw new Error("No files found for this PIN");
      }

      // Backend sends files array with name & size
      setFileDetails(data.files);
      setExpiry(data.expires_in_min ? data.expires_in_min + " minutes" : "5 minutes");

      toast({
        title: "Files found",
        description: "Your files are ready to download",
      });

    } catch (error: any) {
      toast({
        title: "Not Found",
        description: error.message,
        variant: "destructive",
      });
      setFileDetails([]);
    }
  };

  // ------------------------------
  // HANDLE DOWNLOAD FOR SINGLE FILE
  // ------------------------------
  const handleDownload = (filename: string) => {
    if (!filename) return;

    const url = `http://127.0.0.1:8000/api/file/${pin}/${filename}`;
    window.open(url, "_blank");

    toast({
      title: "Download started",
      description: `${filename} is being downloaded`,
    });
  };

  // ------------------------------
  // HANDLE DOWNLOAD ALL FILES AS ZIP
  // ------------------------------
  const handleDownloadAll = async () => {
    if (fileDetails.length === 0) return;

    const url = `http://127.0.0.1:8000/api/file/${pin}/all`;
    window.open(url, "_blank");

    toast({
      title: "Download started",
      description: "All files are being downloaded as a ZIP",
    });
  };

  return (
    <Card className="p-6 shadow-soft animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <Download className="w-6 h-6 text-secondary" />
        </div>
        <h2 className="text-2xl font-semibold">Retrieve Files</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Enter PIN or Scan QR Code</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter 6-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              maxLength={6}
              className="font-mono text-lg tracking-wider"
            />
            <Button onClick={handleRetrieve} className="px-6">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {fileDetails.length > 0 && (
          <div className="mt-6 p-6 bg-gradient-subtle rounded-xl border animate-scale-in space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleDownloadAll}>
                <Archive className="w-4 h-4 mr-2" /> Download All
              </Button>
            </div>

            {fileDetails.map((file, index) => (
              <div key={index} className="flex items-center justify-between gap-4 bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">Size: {file.size}</p>
                    <p className="text-sm text-muted-foreground">Expires in: <span className="text-destructive font-medium">{expiry}</span></p>
                  </div>
                </div>
                <Button onClick={() => handleDownload(file.name)}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
