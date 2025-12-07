import { useState } from 'react';
import { MessageSquare, Copy, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

export const TextSharingSection = () => {
  const [text, setText] = useState('');
  const [sharedText, setSharedText] = useState<{
    content: string;
    pin: string;
    expiryMinutes: number;
    qr: string;
  } | null>(null);

  const [copiedPin, setCopiedPin] = useState(false);
  const { toast } = useToast();

  const backendURL = "http://localhost:8000"; // change if server IP different

  const handleShare = async () => {
    if (!text.trim()) {
      toast({
        title: "Enter text to share",
        description: "Please type something before sharing",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("message", text);

      const res = await fetch(`${backendURL}/api/text/share`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setSharedText({
        content: text,
        pin: data.pin,
        expiryMinutes: data.expires_in_min,
        qr: data.qr_code_base64,
      });

      toast({
        title: "Text shared successfully",
        description: "Your text is now accessible via PIN or QR code",
      });

    } catch (err) {
      toast({
        title: "Error",
        description: "Could not connect to backend",
        variant: "destructive",
      });
    }
  };

  const copyPin = () => {
    if (sharedText) {
      navigator.clipboard.writeText(sharedText.pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
      toast({
        title: "PIN copied",
        description: "Share this PIN to allow text access",
      });
    }
  };

  return (
    <Card className="p-6 shadow-soft animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent/10 rounded-lg">
          <MessageSquare className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-2xl font-semibold">Share Text</h2>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Type or paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[150px] resize-none"
        />

        <Button onClick={handleShare} className="w-full" size="lg">
          Generate PIN & QR Code
        </Button>

        {sharedText && (
          <div className="mt-6 p-6 bg-gradient-subtle rounded-xl border animate-scale-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Expires in{" "}
                  <span className="font-semibold text-foreground">
                    {sharedText.expiryMinutes} minutes
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your PIN</p>
                <code className="text-2xl font-mono font-bold">
                  {sharedText.pin}
                </code>
              </div>

              <Button variant="outline" size="sm" onClick={copyPin}>
                {copiedPin ? (
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex justify-center pt-2">
              <div className="p-4 bg-background rounded-xl shadow-glow">
                <img
                  src={`data:image/png;base64,${sharedText.qr}`}
                  alt="QR Code"
                  width={160}
                />
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  Scan to view text
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
