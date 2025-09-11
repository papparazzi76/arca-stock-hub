import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCodeIcon } from "lucide-react";
import { Pallet } from "@/types/warehouse";

interface PalletRegistrationProps {
  onRegister: (pallet: Omit<Pallet, 'id'>) => Promise<void>;
  onStartScanner: (inputId: string) => void;
}

export const PalletRegistration = ({ onRegister, onStartScanner }: PalletRegistrationProps) => {
  const [qrCode, setQrCode] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode || !description || !quantity || !location) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({
        qrCode: qrCode.trim(),
        description: description.trim(),
        quantity: parseInt(quantity, 10),
        location: location.trim().toUpperCase(),
      });
      
      // Reset form
      setQrCode("");
      setDescription("");
      setQuantity("");
      setLocation("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Registrar Palet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="qrCode">Código QR del Palet:</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="qrCode"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Introduce el código QR"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onStartScanner('qrCode')}
                variant="outline"
                size="icon"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <QrCodeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción:</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Ladrillos, Cemento, etc."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Cantidad:</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ej. 100"
              className="mt-1"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="location">Ubicación (Ej. A2-3-1 o D5):</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Sección-Nicho-Nivel-Palet"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onStartScanner('location')}
                variant="outline"
                size="icon"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <QrCodeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !qrCode || !description || !quantity || !location}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSubmitting ? "Registrando..." : "Registrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};