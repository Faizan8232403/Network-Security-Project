import { useState } from 'react';
import { Search, FileText, Clock, Edit, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export const TextRetrievalSection = () => {
  const [pin, setPin] = useState('');
  const [retrievedText, setRetrievedText] = useState<{
    content: string;
    expiryMinutes: number;
    editable: boolean;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const { toast } = useToast();

  const BACKEND_URL = "http://localhost:8000"; // change if needed

  // -------------------- GET TEXT FROM BACKEND --------------------
  const handleRetrieve = async () => {
    if (!pin) {
      toast({
        title: "Enter a PIN",
        description: "Please enter a valid PIN to retrieve text",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/text/${pin}`);
      if (!res.ok) throw new Error("Invalid or expired PIN");

      const data = await res.json();

      setRetrievedText({
        content: data.message,
        expiryMinutes: 5,  // same expiry as backend
        editable: true,
      });

      setEditedContent(data.message);

      toast({
        title: "Text retrieved successfully",
        description: "Your shared text is ready to view",
      });
    } catch (err: any) {
      toast({
        title: "Error retrieving text",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // -------------------- SAVE UPDATED TEXT --------------------
  const handleSave = async () => {
    if (!retrievedText) return;

    try {
      const formData = new FormData();
      formData.append("message", editedContent);

      const res = await fetch(`${BACKEND_URL}/api/text/${pin}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update text");

      setRetrievedText({
        ...retrievedText,
        content: editedContent,
      });

      setIsEditing(false);

      toast({
        title: "Changes saved",
        description: "Your edits have been updated on server",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // -------------------- COPY TEXT --------------------
  const copyText = () => {
    if (retrievedText) {
      navigator.clipboard.writeText(retrievedText.content);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);

      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    }
  };

  return (
    <Card className="p-6 shadow-soft animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Retrieve Text</h2>
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

        {retrievedText && (
          <div className="mt-6 p-6 bg-gradient-subtle rounded-xl border animate-scale-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Expires in <span className="font-semibold text-destructive">
                    {retrievedText.expiryMinutes} minutes
                  </span>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyText}
              >
                {copiedText ? (
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(retrievedText.content);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-background rounded-lg border min-h-[150px]">
                  <p className="text-foreground whitespace-pre-wrap">
                    {retrievedText.content}
                  </p>
                </div>

                {retrievedText.editable && (
                  <Button onClick={() => setIsEditing(true)} variant="secondary" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Text
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
