import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, X, Download } from 'lucide-react';

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  fileName: string;
}

export function PdfViewerDialog({ open, onOpenChange, pdfUrl, fileName }: PdfViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pdfUrl && window.open(pdfUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={fileName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing PDF viewer state
export function usePdfViewer() {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState('');

  const openPdf = (url: string, name: string) => {
    setPdfUrl(url);
    setPdfName(name);
    setPdfViewerOpen(true);
  };

  const closePdf = () => {
    setPdfViewerOpen(false);
  };

  return {
    pdfViewerOpen,
    setPdfViewerOpen,
    pdfUrl,
    pdfName,
    openPdf,
    closePdf,
  };
}
