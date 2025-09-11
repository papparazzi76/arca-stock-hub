import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WarehouseStatsCard } from "@/components/WarehouseStats";
import { PalletRegistration } from "@/components/PalletRegistration";
import { PalletSearch } from "@/components/PalletSearch";
import { WarehouseViewer } from "@/components/WarehouseViewer";
import { QRGenerator } from "@/components/QRGenerator";
import { Pallet, WarehouseStats } from "@/types/warehouse";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pallets, setPallets] = useState<Record<string, Pallet>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<WarehouseStats>({ totalPallets: 0, totalQuantity: 0, emptySpots: 164 });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Calculate total warehouse spots
  const calculateTotalSpots = () => {
    const spotsA = 3 * 4 * 3; // 3 nichos (A1,A2,A3) * 4 niveles * 3 palets 
    const spotsB = (1 * 4 * 3) + (1 * 4) + (1 * 4 * 3); // B2: 1 nicho * 4 niveles * 3 palets + B3: 1 nicho, 4 bandejas en Nivel 1 + 1 nicho * 4 niveles * 3 palets
    const spotsC = (5 * 4) + (5 * 3 * 3); // 5 nichos (C1-C5), 4 bandejas en Nivel 1 + 5 nichos * 3 niveles * 3 palets
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

  // Load pallets from Supabase
  const loadPallets = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('pallets')
      .select('*');

    if (error) {
      console.error('Error loading pallets:', error);
      toast({
        title: "Error",
        description: "Error al cargar los palets del almacén.",
        variant: "destructive"
      });
      return;
    }

    const palletsRecord: Record<string, Pallet> = {};
    const locationsRecord: Record<string, string> = {};
    
    data.forEach(pallet => {
      const palletData: Pallet = {
        id: pallet.id,
        qrCode: pallet.qr_code,
        description: pallet.description,
        quantity: pallet.quantity,
        location: pallet.location,
        createdAt: new Date(pallet.created_at),
        updatedAt: new Date(pallet.updated_at)
      };
      palletsRecord[pallet.qr_code] = palletData;
      locationsRecord[pallet.location] = pallet.qr_code;
    });

    setPallets(palletsRecord);
    setLocations(locationsRecord);
  };

  useEffect(() => {
    if (user) {
      loadPallets();
    }
  }, [user]);

  useEffect(() => {
    updateStats();
  }, [pallets]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('pallets-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pallets' 
      }, () => {
        loadPallets();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

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
        if (isNaN(nicheNum) || nicheNum < 1 || nicheNum > 3) {
          return 'Para la Sección A, el nicho debe ser un número del 1 al 3.';
        }
      } else if (section === 'B') {
        if (isNaN(nicheNum) || nicheNum < 2 || nicheNum > 3) {
          return 'Para la Sección B, el nicho debe ser un número del 2 al 3.';
        }
      } else if (section === 'C') {
        if (isNaN(nicheNum) || nicheNum < 1 || nicheNum > 5) {
          return 'Para la Sección C, el nicho debe ser un número del 1 al 5.';
        }
      }

      if ((section === 'C' || (section === 'B' && niche === '3')) && level === '1') {
        const subLevel = parseInt(palletNumber, 10);
        const maxTrays = (section === 'B' && niche === '3') ? 5 : 4; // B3 has 5 trays, C sections have 4
        if (isNaN(subLevel) || subLevel < 1 || subLevel > maxTrays) {
          return `Para la Sección ${section}, Nicho ${niche}, Nivel 1, el palet debe ser un subnivel entre 1 y ${maxTrays}.`;
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

  const handleRegisterPallet = async (palletData: Omit<Pallet, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

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

    // Insert into Supabase
    const { error } = await supabase
      .from('pallets')
      .insert([{
        user_id: user.id,
        qr_code: palletData.qrCode,
        description: palletData.description,
        quantity: palletData.quantity,
        location: palletData.location
      }]);

    if (error) {
      console.error("Error adding pallet:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al registrar el palet.",
        variant: "destructive"
      });
      return;
    }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-arca-blue-light to-arca-blue">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="flex items-center gap-4">
              <span className="text-primary-foreground/90">
                Bienvenido, {user.email}
              </span>
              <Button 
                onClick={signOut}
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Sistema de Gestión de Almacén</h1>
            <p className="text-xl opacity-90">Arca Grupo Carranza</p>
          </div>
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
            <QRGenerator />
          </div>

          {/* Warehouse Viewer */}
          <WarehouseViewer pallets={pallets} />
        </div>
      </main>
    </div>
  );
};

export default Index;
