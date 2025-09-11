import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCodeIcon, SearchIcon } from "lucide-react";
import { Pallet } from "@/types/warehouse";

interface PalletSearchProps {
  pallets: Record<string, Pallet>;
  onStartScanner: (inputId: string) => void;
}

export const PalletSearch = ({ pallets, onStartScanner }: PalletSearchProps) => {
  const [searchQrCode, setSearchQrCode] = useState("");
  const [searchResult, setSearchResult] = useState<Pallet | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    if (!searchQrCode.trim()) return;
    
    const pallet = pallets[searchQrCode.trim()];
    if (pallet) {
      setSearchResult(pallet);
      setNotFound(false);
    } else {
      setSearchResult(null);
      setNotFound(true);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Buscar Palet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="searchQrCode">Código QR a buscar:</Label>
          <div className="flex space-x-2 mt-1">
            <Input
              id="searchQrCode"
              value={searchQrCode}
              onChange={(e) => setSearchQrCode(e.target.value)}
              placeholder="Introduce o escanea el código QR"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              type="button"
              onClick={() => onStartScanner('searchQrCode')}
              variant="outline"
              size="icon"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <QrCodeIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={!searchQrCode.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          Buscar
        </Button>

        {searchResult && (
          <div className="p-3 bg-secondary rounded-md">
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Código QR:</span> <span className="font-bold">{searchResult.qrCode}</span></p>
              <p><span className="font-medium">Descripción:</span> <span className="font-bold">{searchResult.description}</span></p>
              <p><span className="font-medium">Cantidad:</span> <span className="font-bold">{searchResult.quantity}</span></p>
              <p><span className="font-medium">Ubicación:</span> <span className="font-bold text-accent">{searchResult.location}</span></p>
            </div>
          </div>
        )}

        {notFound && (
          <div className="p-3 bg-destructive/10 rounded-md">
            <p className="text-destructive font-bold text-sm">Palet no encontrado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};