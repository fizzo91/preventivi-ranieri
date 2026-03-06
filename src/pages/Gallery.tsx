import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { supabase } from "@/integrations/supabase/client"
import { extractPathFromSignedUrl, regenerateSignedUrl } from "@/services/storageService"
import { formatCurrency } from "@/utils/formatting"
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ExternalLink, Image as ImageIcon } from "lucide-react";

interface GalleryImage {
  imageUrl: string;
  imagePath?: string;
  sectionName: string;
  sectionDescription: string;
  quoteId: string;
  quoteNumber: string;
  clientName: string;
  totalAmount: number;
}

const Gallery = () => {
  const navigate = useNavigate();
  const { data: quotes, isLoading } = useQuotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [imagesWithUrls, setImagesWithUrls] = useState<GalleryImage[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Extract all images from quotes sections
  const galleryImages = useMemo(() => {
    if (!quotes) return [];

    const images: GalleryImage[] = [];

    quotes.forEach((quote) => {
      const sections = quote.sections as any[];
      if (!sections || !Array.isArray(sections)) return;

      sections.forEach((section) => {
        if (section.chartImage || section.chartImagePath) {
          // Try to extract path from signed URL if chartImagePath is missing
          let imagePath = section.chartImagePath;
          if (!imagePath && section.chartImage) {
            imagePath = extractPathFromSignedUrl(section.chartImage);
          }
          images.push({
            imageUrl: section.chartImage || "",
            imagePath: imagePath,
            sectionName: section.name || "Sezione",
            sectionDescription: section.description || "",
            quoteId: quote.id,
            quoteNumber: quote.quote_number,
            clientName: quote.client_name || "",
            totalAmount: quote.total_amount,
          });
        }
      });
    });

    return images;
  }, [quotes]);

  // Regenerate signed URLs for images with chartImagePath
  useEffect(() => {
    const regenerateUrls = async () => {
      setLoadingUrls(true);
      setFailedImages(new Set());
      const updatedImages = await Promise.all(
        galleryImages.map(async (img) => {
          if (img.imagePath) {
            const url = await regenerateSignedUrl(img.imagePath);
            if (url) return { ...img, imageUrl: url };
          }
          return img;
        })
      );
      setImagesWithUrls(updatedImages);
      setLoadingUrls(false);
    };

    if (galleryImages.length > 0) {
      regenerateUrls();
    } else {
      setImagesWithUrls([]);
      setLoadingUrls(false);
    }
  }, [galleryImages]);

  // Filter images based on search term
  const filteredImages = useMemo(() => {
    if (!searchTerm.trim()) return imagesWithUrls;

    const term = searchTerm.toLowerCase();
    return imagesWithUrls.filter(
      (img) =>
        img.quoteNumber.toLowerCase().includes(term) ||
        img.clientName.toLowerCase().includes(term) ||
        img.sectionName.toLowerCase().includes(term) ||
        img.sectionDescription.toLowerCase().includes(term)
    );
  }, [imagesWithUrls, searchTerm]);

  const formatAmount = (amount: number) => formatCurrency(amount);

  const openQuote = (quoteId: string) => {
    navigate(`/new-quote?edit=${quoteId}`);
  };

  if (isLoading || loadingUrls) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold">Galleria Progetti</h1>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per preventivo o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
          <p>
            {searchTerm
              ? "Nessuna immagine trovata"
              : "Nessuna immagine caricata nei preventivi"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((image, index) => (
            <Card
              key={`${image.quoteId}-${index}`}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
            {/* Image Preview */}
              <div
                className="aspect-square bg-muted cursor-pointer overflow-hidden relative group"
                onClick={() => openQuote(image.quoteId)}
              >
                {image.imageUrl && !failedImages.has(`${image.quoteId}-${index}`) ? (
                  <img
                    src={image.imageUrl}
                    alt={image.sectionName}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={() => {
                      setFailedImages(prev => new Set(prev).add(`${image.quoteId}-${index}`));
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10 opacity-40" />
                    <span className="text-xs">Immagine non disponibile</span>
                  </div>
                )}
              </div>

              {/* Card Info */}
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold text-sm truncate">
                  {image.quoteNumber}
                </div>
                {image.clientName && (
                  <div className="text-sm text-muted-foreground truncate">
                    {image.clientName}
                  </div>
                )}
                <div className="text-sm font-medium text-primary">
                  {formatCurrency(image.totalAmount)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => openQuote(image.quoteId)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apri Preventivo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedImage?.quoteNumber}
                {selectedImage?.clientName && ` • ${selectedImage.clientName}`}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {selectedImage && (
              <>
                <div className="relative bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.sectionName}
                    className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Sezione: {selectedImage.sectionName}
                    </span>
                    <span className="font-medium text-primary">
                      {formatCurrency(selectedImage.totalAmount)}
                    </span>
                  </div>
                  {selectedImage.sectionDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {selectedImage.sectionDescription}
                    </p>
                  )}
                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      openQuote(selectedImage.quoteId);
                      setSelectedImage(null);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apri Preventivo
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
