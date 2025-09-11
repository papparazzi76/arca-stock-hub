import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Printer, Download, RefreshCw, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";

interface LocationQR {
  id: string;
  location: string;
  qr_code: string;
  section: string;
}

interface PalletQR {
  id: string;
  qr_code: string;
  is_used: boolean;
}

export const QRGenerator = () => {
  const [locationQRs, setLocationQRs] = useState<LocationQR[]>([]);
  const [palletQRs, setPalletQRs] = useState<PalletQR[]>([]);
  const [isGeneratingLocations, setIsGeneratingLocations] = useState(false);
  const [isGeneratingPallet, setIsGeneratingPallet] = useState(false);
  const [selectedLocationQRs, setSelectedLocationQRs] = useState<string[]>([]);
  const [manualLocation, setManualLocation] = useState("");
  const [selectedDropdownLocation, setSelectedDropdownLocation] = useState("");
  const [individualLocations, setIndividualLocations] = useState<string[]>([]);
  const { toast } = useToast();

  // Generate all possible warehouse locations
  const generateAllLocations = () => {
    const locations: string[] = [];
    
    // Section A: 3 nichos, 4 niveles, 3 palets por nivel
    for (let niche = 1; niche <= 3; niche++) {
      for (let level = 1; level <= 4; level++) {
        for (let pallet = 1; pallet <= 3; pallet++) {
          locations.push(`A${niche}-${level}-${pallet}`);
        }
      }
    }

    // Section B: 2 nichos (B2, B3), 4 niveles
    for (let niche = 2; niche <= 3; niche++) {
      for (let level = 1; level <= 4; level++) {
        if (niche === 3 && level === 1) {
          // B3 nivel 1 tiene 5 bandejas
          for (let tray = 1; tray <= 5; tray++) {
            locations.push(`B3-1-${tray}`);
          }
        } else {
          // Resto de B tienen 3 palets por nivel
          for (let pallet = 1; pallet <= 3; pallet++) {
            locations.push(`B${niche}-${level}-${pallet}`);
          }
        }
      }
    }

    // Section C: 5 nichos, 4 niveles
    for (let niche = 1; niche <= 5; niche++) {
      for (let level = 1; level <= 4; level++) {
        if (level === 1) {
          // Nivel 1 tiene 4 bandejas
          for (let tray = 1; tray <= 4; tray++) {
            locations.push(`C${niche}-1-${tray}`);
          }
        } else {
          // Otros niveles tienen 3 palets
          for (let pallet = 1; pallet <= 3; pallet++) {
            locations.push(`C${niche}-${level}-${pallet}`);
          }
        }
      }
    }

    // Section D: 28 espacios en el suelo
    for (let spot = 1; spot <= 28; spot++) {
      locations.push(`D${spot}`);
    }

    return locations;
  };

  // Load existing QR codes
  const loadLocationQRs = async () => {
    try {
      const { data, error } = await supabase
        .from('location_qrs')
        .select('*')
        .order('location');
      
      if (error) throw error;
      setLocationQRs(data || []);
    } catch (error) {
      console.error('Error loading location QRs:', error);
    }
  };

  const loadPalletQRs = async () => {
    try {
      const { data, error } = await supabase
        .from('pallet_qrs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setPalletQRs(data || []);
    } catch (error) {
      console.error('Error loading pallet QRs:', error);
    }
  };

  useEffect(() => {
    loadLocationQRs();
    loadPalletQRs();
  }, []);

  // Generate location QR codes
  const generateLocationQRs = async (locationsToGenerate: string[] = []) => {
    setIsGeneratingLocations(true);
    try {
      const allLocations = generateAllLocations();
      const locations = locationsToGenerate.length > 0 ? locationsToGenerate : allLocations;
      
      for (const location of locations) {
        // Check if QR already exists
        const { data: existing } = await supabase
          .from('location_qrs')
          .select('id')
          .eq('location', location)
          .single();

        if (!existing) {
          const qrData = `LOC:${location}`;
          const section = location.charAt(0);
          
          const { error } = await supabase
            .from('location_qrs')
            .insert({
              location,
              qr_code: qrData,
              section
            });

          if (error) throw error;
        }
      }

      await loadLocationQRs();
      toast({
        title: "QR de ubicaciones generados",
        description: `Se generaron QR para ${locations.length} ubicaciones`,
      });
    } catch (error) {
      console.error('Error generating location QRs:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar los QR de ubicaciones",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLocations(false);
    }
  };

  // Generate random pallet QR
  const generatePalletQR = async () => {
    setIsGeneratingPallet(true);
    try {
      const randomId = crypto.randomUUID();
      const qrData = `PALLET:${randomId}`;
      
      const { error } = await supabase
        .from('pallet_qrs')
        .insert({
          qr_code: qrData,
          is_used: false
        });

      if (error) throw error;

      await loadPalletQRs();
      toast({
        title: "QR de palet generado",
        description: "Nuevo QR aleatorio creado para palet",
      });
    } catch (error) {
      console.error('Error generating pallet QR:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el QR de palet",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPallet(false);
    }
  };

  // Print QR codes
  const printQRCodes = async (qrCodes: string[], title: string) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      let htmlContent = `
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
              .qr-item { text-align: center; page-break-inside: avoid; }
              .qr-item img { max-width: 150px; height: 150px; }
              .qr-item p { margin: 10px 0; font-weight: bold; }
              @media print { .qr-grid { grid-template-columns: repeat(2, 1fr); } }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="qr-grid">
      `;

      for (const qrCode of qrCodes) {
        const qrImageUrl = await QRCode.toDataURL(qrCode, { width: 150 });
        const location = qrCode.replace('LOC:', '').replace('PALLET:', '');
        htmlContent += `
          <div class="qr-item">
            <img src="${qrImageUrl}" alt="QR Code" />
            <p>${location}</p>
          </div>
        `;
      }

      htmlContent += `
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing QR codes:', error);
      toast({
        title: "Error",
        description: "No se pudieron imprimir los códigos QR",
        variant: "destructive"
      });
    }
  };

  // Add individual location to selection
  const addIndividualLocation = (location: string) => {
    const trimmedLocation = location.trim();
    if (trimmedLocation && !individualLocations.includes(trimmedLocation)) {
      setIndividualLocations([...individualLocations, trimmedLocation]);
    }
  };

  // Remove individual location from selection
  const removeIndividualLocation = (location: string) => {
    setIndividualLocations(individualLocations.filter(loc => loc !== location));
  };

  // Add location from dropdown
  const addFromDropdown = () => {
    if (selectedDropdownLocation) {
      addIndividualLocation(selectedDropdownLocation);
      setSelectedDropdownLocation("");
    }
  };

  // Add location from manual input
  const addFromManual = () => {
    if (manualLocation) {
      addIndividualLocation(manualLocation);
      setManualLocation("");
    }
  };

  // Print individual locations
  const printIndividualLocations = async () => {
    const qrCodesToPrint = locationQRs
      .filter(qr => individualLocations.includes(qr.location))
      .map(qr => qr.qr_code);
    
    if (qrCodesToPrint.length === 0) {
      toast({
        title: "Sin ubicaciones",
        description: "No hay ubicaciones seleccionadas para imprimir",
        variant: "destructive"
      });
      return;
    }

    await printQRCodes(qrCodesToPrint, "QR de Ubicaciones Seleccionadas");
  };

  // Group location QRs by section
  const groupedLocationQRs = locationQRs.reduce((acc, qr) => {
    if (!acc[qr.section]) acc[qr.section] = [];
    acc[qr.section].push(qr);
    return acc;
  }, {} as Record<string, LocationQR[]>);


  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Generador de QR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location QR Generator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">QR de Ubicaciones</h3>
            <Badge variant="secondary">{locationQRs.length} ubicaciones</Badge>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="locations">
              <AccordionTrigger>Seleccionar ubicaciones para generar/imprimir</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateLocationQRs()}
                    disabled={isGeneratingLocations}
                  >
                    {isGeneratingLocations ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Todos"}
                  </Button>
                  
                  {Object.keys(groupedLocationQRs).map(section => (
                    <Button
                      key={section}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const sectionLocations = groupedLocationQRs[section].map(qr => qr.location);
                        generateLocationQRs(sectionLocations);
                      }}
                    >
                      Sección {section}
                    </Button>
                  ))}
                </div>

                {/* Individual location selection */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Seleccionar ubicaciones individuales:</h4>
                  
                  {/* Dropdown selection */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="location-select" className="text-xs text-muted-foreground">
                        Seleccionar de la lista:
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Select value={selectedDropdownLocation} onValueChange={setSelectedDropdownLocation}>
                          <SelectTrigger id="location-select" className="flex-1">
                            <SelectValue placeholder="Elegir ubicación..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 bg-background border">
                            {locationQRs.map(qr => (
                              <SelectItem key={qr.id} value={qr.location}>
                                {qr.location} (Sección {qr.section})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addFromDropdown}
                          disabled={!selectedDropdownLocation}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Manual input */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="manual-location" className="text-xs text-muted-foreground">
                        Escribir manualmente:
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="manual-location"
                          placeholder="Ej: A1-2-3, B3-1-4, C2-1-2, D15..."
                          value={manualLocation}
                          onChange={(e) => setManualLocation(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addFromManual()}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={addFromManual}
                          disabled={!manualLocation}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Selected locations */}
                  {individualLocations.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Ubicaciones seleccionadas ({individualLocations.length}):
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {individualLocations.map(location => (
                          <Badge key={location} variant="secondary" className="flex items-center gap-1">
                            {location}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-destructive" 
                              onClick={() => removeIndividualLocation(location)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={printIndividualLocations}
                        className="w-full"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir Ubicaciones Seleccionadas
                      </Button>
                    </div>
                  )}
                </div>

                {locationQRs.length > 0 && (
                  <div className="flex gap-2 flex-wrap border-t pt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => printQRCodes(locationQRs.map(qr => qr.qr_code), "Todos los QR de Ubicaciones")}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Todos
                    </Button>
                    
                    {Object.entries(groupedLocationQRs).map(([section, qrs]) => (
                      <Button
                        key={section}
                        variant="secondary"
                        size="sm"
                        onClick={() => printQRCodes(qrs.map(qr => qr.qr_code), `QR Sección ${section}`)}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir {section}
                      </Button>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Pallet QR Generator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">QR de Palets</h3>
            <Badge variant="secondary">{palletQRs.filter(qr => !qr.is_used).length} disponibles</Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={generatePalletQR}
              disabled={isGeneratingPallet}
              className="flex-1"
            >
              {isGeneratingPallet ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              Generar QR Aleatorio
            </Button>
            
            {palletQRs.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => printQRCodes(
                  palletQRs.filter(qr => !qr.is_used).map(qr => qr.qr_code),
                  "QR de Palets Disponibles"
                )}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            )}
          </div>

          {palletQRs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Últimos QR generados:</p>
              <div className="grid gap-2">
                {palletQRs.slice(0, 3).map(qr => (
                  <div key={qr.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-mono text-sm">{qr.qr_code.replace('PALLET:', '')}</span>
                    <Badge variant={qr.is_used ? "secondary" : "default"}>
                      {qr.is_used ? "Usado" : "Disponible"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Flujo de trabajo:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Generar todos los QR fijos de ubicaciones</li>
            <li>Generar QR aleatorio para nuevo palet</li>
            <li>Escanear QR del palet</li>
            <li>Escanear QR de la ubicación (verificar si está vacía)</li>
            <li>Confirmar ocupación del hueco en la app</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};