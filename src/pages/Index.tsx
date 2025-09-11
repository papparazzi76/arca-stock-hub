import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { WarehouseStatsCard } from "@/components/WarehouseStats";
import { PalletRegistration } from "@/components/PalletRegistration";
import { PalletSearch } from "@/components/PalletSearch";
import { WarehouseViewer } from "@/components/WarehouseViewer";
import { Pallet, WarehouseStats, LastAction } from "@/types/warehouse";

const Index = () => {
  const { toast } = useToast();
  const [pallets, setPallets] = useState<Record<string, Pallet>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<WarehouseStats>({ totalPallets: 0, totalQuantity: 0, emptySpots: 164 });
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  // Calculate total warehouse spots
  const calculateTotalSpots = () => {
    const spotsA = (5 * 4) + (5 * 3 * 3); // 5 nichos, 4 bandejas en Nivel 1 + 5 nichos * 3 niveles * 3 palets
    const spotsB = (1 * 4) + (2 * 4 * 3); // 1 nicho, 4 bandejas en Nivel 1 + 2 nichos * 4 niveles * 3 palets
    const spotsC = 3 * 4 * 3; // 3 nichos * 4 niveles * 3 palets
    const spotsD = 28; // 28 espacios en el suelo
    return spotsA + spotsB + spotsC + spotsD;
  };

  const updateStats = () => {
    const palletArray = Object.values(pallets);
    const totalSpots = calculateTotalSpots();
    setStats({
      totalPallets: palletArray.length,
      totalQuantity: palletArray.reduce((sum, pallet) => sum + pallet.quantity, 0),
      emptySpots: totalSpots - palletArray.length
    });
  };

  useEffect(() => {
    updateStats();
  }, [pallets]);

  const validateLocation = (location: string): string | null => {
    if (location.startsWith('D')) {
      const locationNumber = parseInt(location.substring(1), 10);
      if (isNaN(locationNumber) || locationNumber < 1 || locationNumber > 28) {
        return 'El formato de la ubicación es incorrecto. La Sección D debe ir seguida de un número del 1 al 28.';
      }
    } else {
      const locationParts = location.split('-');
      if (locationParts.length !== 4) {
        return 'El formato de la ubicación es incorrecto. Debe ser "Sección-Nicho-Nivel-Palet" (Ej: A2-3-1).';
      }

      const [section, niche, level, palletNumber] = locationParts;

      if (!['A', 'B', 'C'].includes(section)) {
        return 'El formato de la ubicación es incorrecto. La sección debe ser A, B o C.';
      }
      
      const nicheNum = parseInt(niche, 10);
      if (section === 'A') {
        if (isNaN(nicheNum) || nicheNum < 1 || nicheNum > 5) {
          return 'Para la Sección A, el nicho debe ser un número del 1 al 5.';
        }
      } else if (section === 'B' || section === 'C') {
        if (isNaN(nicheNum) || nicheNum < 1 || nicheNum > 3) {
          return `Para la Sección ${section}, el nicho debe ser un número del 1 al 3.`;
        }
      }

      if ((section === 'A' || (section === 'B' && niche === '1')) && level === '1') {
        const subLevel = parseInt(palletNumber, 10);
        if (isNaN(subLevel) || subLevel < 1 || subLevel > 4) {
          return 'Para la Sección A, Nivel 1 y la Sección B, Nicho 1, Nivel 1, el palet debe ser un subnivel entre 1 y 4.';
        }
      } else {
        const palletNum = parseInt(palletNumber, 10);
        if (isNaN(palletNum) || palletNum < 1 || palletNum > 3) {
          return 'Para las ubicaciones de palets, el número debe ser 1, 2 o 3.';
        }
      }
    }
    return null;
  };

  const handleRegisterPallet = async (palletData: Omit<Pallet, 'id'>) => {
    // Validation
    const locationError = validateLocation(palletData.location);
    if (locationError) {
      toast({
        title: "Error de validación",
        description: locationError,
        variant: "destructive"
      });
      return;
    }

    if (pallets[palletData.qrCode]) {
      toast({
        title: "Error",
        description: "Ya existe un palet con este código QR. Por favor, utiliza la sección de edición.",
        variant: "destructive"
      });
      return;
    }

    if (locations[palletData.location]) {
      toast({
        title: "Error",
        description: `La ubicación ${palletData.location} ya está ocupada por otro palet.`,
        variant: "destructive"
      });
      return;
    }

    // Create new pallet with ID
    const newPallet: Pallet = {
      ...palletData,
      id: `pallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update state
    setPallets(prev => ({ ...prev, [newPallet.qrCode]: newPallet }));
    setLocations(prev => ({ ...prev, [newPallet.location]: newPallet.qrCode }));
    
    // Set last action for undo
    setLastAction({ type: 'register', id: newPallet.id, qrCode: newPallet.qrCode });

    toast({
      title: "Palet registrado",
      description: `Palet ${palletData.qrCode} registrado en ${palletData.location} con ${palletData.quantity} unidades de "${palletData.description}".`,
    });
  };

  const handleStartScanner = (inputId: string) => {
    // Since we need Supabase integration for this feature, we'll show a message
    toast({
      title: "Funcionalidad de backend requerida",
      description: "Para usar el escáner QR y la funcionalidad completa, necesitas conectar tu proyecto con Supabase.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Sistema de Gestión de Almacén</h1>
          <p className="text-xl opacity-90">Arca Grupo Carranza</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Statistics */}
          <WarehouseStatsCard stats={stats} />

          {/* Management Panels */}
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <PalletRegistration 
              onRegister={handleRegisterPallet}
              onStartScanner={handleStartScanner}
            />
            <PalletSearch 
              pallets={pallets}
              onStartScanner={handleStartScanner}
            />
          </div>

          {/* Warehouse Viewer */}
          <WarehouseViewer pallets={pallets} />
        </div>
      </main>
    </div>
  );
};

export default Index;
