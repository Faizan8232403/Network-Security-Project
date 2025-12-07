import { useState, useCallback } from 'react';
import { Upload, File, Clock, QrCode, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

// 🔥 NEW INTERFACE (single group with per-file progress)
interface UploadedFile {
  name: string;
  size: string;
  progress: number; // individual file progress
}

interface UploadedGroup {
  pin: string;
  qr: string;
  files: UploadedFile[];
}

export const FileUploadSection = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedGroup, setUploadedGroup] = useState<UploadedGroup | null>(null);
  const [expiry, setExpiry] = useState('60');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  // 🔥 PROCESS FILES – WITH PER-FILE PROGRESS
  const processFiles = async (files: File[]) => {
    setIsUploading(true);

    // Initialize individual progress
    const fileList: UploadedFile[] = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      progress: 0
    }));
    setUploadedGroup({ pin: '', qr: '', files: fileList });

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/file/share", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Update all files proportionally
            setUploadedGroup(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map(f => ({ ...f, progress: percent }))
              };
            });
          }
        }
      });

      const data = response.data;

      // Set the uploaded group with real PIN and QR
      setUploadedGroup(prev => {
        if (!prev) return prev;
        return { ...prev, pin: data.pin, qr: data.qr_code_base64 };
      });

    } catch (err) {
      console.error(err);
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading files",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
    toast({
      title: "PIN copied",
      description: "Share this PIN to allow file downloads",
    });
  };

  const shareUrl = uploadedGroup?.pin
    ? `http://127.0.0.1:8000/api/file/${uploadedGroup.pin}`
    : '';

  return (
    <Card className="p-6 shadow-soft animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Upload Files</h2>
      </div>

      {/* DRAG & DROP */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-smooth cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50'}`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 transition-smooth ${isDragging ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
        <p className="text-lg font-medium mb-2">Drag & drop your files here</p>
        <p className="text-sm text-muted-foreground mb-4">or click to browse</p>

        <input type="file" multiple onChange={handleFileInput} className="hidden" id="file-upload" />
        <label htmlFor="file-upload">
          <Button className="cursor-pointer" asChild>
            <span>Choose Files</span>
          </Button>
        </label>
      </div>

      {/* EXPIRY */}
      <div className="flex items-center gap-4 mt-6">
        <div className="flex items-center gap-2 flex-1">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <label className="text-sm font-medium">Expiry (minutes):</label>
          <Input
            type="number"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-24"
            min="1"
          />
        </div>
      </div>

      {/* FILES + PROGRESS + QR */}
      {uploadedGroup && (
        <div className="mt-8 space-y-4 animate-scale-in">
          <h3 className="font-semibold text-lg">Uploaded Files</h3>

          {/* Files list */}
          <div className="grid gap-3">
            {uploadedGroup.files.map((file, index) => (
              <div key={index} className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.size}</p>
                  </div>
                </div>
                {/* Individual progress bar */}
                {isUploading && <Progress value={file.progress} className="h-2" />}
              </div>
            ))}
          </div>

          {/* PIN + COPY BUTTON */}
          <div className="flex items-center gap-2">
            <code className="px-3 py-1 bg-background rounded font-mono text-sm">
              {uploadedGroup.pin}
            </code>
            <Button size="sm" variant="outline" onClick={() => copyPin(uploadedGroup.pin)}>
              {copiedPin === uploadedGroup.pin ? (
                <CheckCircle2 className="w-4 h-4 text-secondary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* QR Code */}
          {shareUrl && (
            <div className="flex justify-center pt-4">
              <div className="p-4 bg-background rounded-xl shadow-glow">
                <QRCodeSVG value={shareUrl} size={180} level="H" />
                <p className="text-xs text-center mt-2 text-muted-foreground">Scan to download</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
