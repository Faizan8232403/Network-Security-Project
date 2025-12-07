import { FileUploadSection } from '@/components/FileUploadSection';
import { FileRetrievalSection } from '@/components/FileRetrievalSection';
import { TextSharingSection } from '@/components/TextSharingSection';
import { TextRetrievalSection } from '@/components/TextRetrievalSection';
import { Share2 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-primary rounded-xl shadow-glow">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ShareAnywhere
              </h1>
            </div>
            <p className="text-sm text-muted-foreground hidden md:block">
              Secure file & text sharing made simple
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Share Files & Text Instantly
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Secure sharing with PIN codes and QR codes. No accounts needed, just share and go.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <FileUploadSection />
            <FileRetrievalSection />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <TextSharingSection />
            <TextRetrievalSection />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-background/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>ShareAnywhere - Built with ❤️ for secure, simple sharing</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
