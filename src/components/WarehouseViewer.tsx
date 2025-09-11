import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pallet } from "@/types/warehouse";

interface WarehouseViewerProps {
  pallets: Record<string, Pallet>;
  filteredPallets?: Pallet[];
}

interface PalletSpotProps {
  location: string;
  palletData?: Pallet;
  spotLabel: string;
}

const PalletSpot = ({ location, palletData, spotLabel }: PalletSpotProps) => {
  return (
    <div className={`
      relative min-h-[40px] border-2 border-warehouse-border rounded-sm
      flex flex-col items-center justify-center p-1 text-xs
      transition-[var(--transition-smooth)] cursor-pointer group
      ${palletData ? 'bg-warehouse-occupied text-white' : 'bg-warehouse-empty'}
      hover:scale-105 hover:shadow-[var(--shadow-glow)]
    `}>
      <span className="font-medium">{spotLabel}</span>
      
      {palletData && (
        <div className="absolute inset-0 bg-primary/90 text-primary-foreground p-1 
                       opacity-0 group-hover:opacity-100 transition-opacity
                       flex flex-col items-center justify-center text-xs">
          <p className="font-bold truncate w-full text-center">QR: {palletData.qrCode}</p>
          <p className="truncate w-full text-center">{palletData.description}</p>
          <p className="font-medium">{palletData.quantity} uds.</p>
        </div>
      )}
    </div>
  );
};

export const WarehouseViewer = ({ pallets, filteredPallets }: WarehouseViewerProps) => {
  const palletsToRender = filteredPallets || Object.values(pallets);
  
  const sections = {
    A: 5, // 5 nichos
    B: 3, // 3 nichos  
    C: 3, // 3 nichos
    D: 28 // 28 floor spots
  };
  
  const levels = 4;

  const renderSection = (sectionKey: string) => {
    if (sectionKey === 'D') {
      return (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {Array.from({ length: sections[sectionKey as keyof typeof sections] }, (_, i) => {
            const location = `D${i + 1}`;
            const palletData = palletsToRender.find(p => p.location === location);
            return (
              <PalletSpot
                key={location}
                location={location}
                palletData={palletData}
                spotLabel={`D${i + 1}`}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sections[sectionKey as keyof typeof sections]}, 1fr)` }}>
        {Array.from({ length: sections[sectionKey as keyof typeof sections] }, (_, nicheIndex) => (
          <div key={`${sectionKey}${nicheIndex + 1}`} 
               className="border-2 border-warehouse-border rounded-lg overflow-hidden bg-warehouse-empty
                         hover:scale-105 transition-[var(--transition-smooth)]">
            {/* Niche Header */}
            <div className="bg-primary text-primary-foreground p-2 text-center font-bold">
              {sectionKey}{nicheIndex + 1}
            </div>
            
            {/* Levels */}
            {Array.from({ length: levels }, (_, levelIndex) => {
              const levelNumber = levels - levelIndex; // Show from top to bottom
              return (
                <div key={`level-${levelNumber}`} className="border-t border-warehouse-border p-2">
                  <div className="text-xs font-medium text-center mb-1 text-muted-foreground">
                    Nivel {levelNumber}
                  </div>
                  
                  {/* Pallet Spots */}
                  <div className="grid gap-1">
                    {((sectionKey === 'A' || (sectionKey === 'B' && nicheIndex === 0)) && levelNumber === 1) ? (
                      // Special case: 4 trays for A and B1 level 1
                      <div className="grid grid-cols-2 gap-1">
                        {Array.from({ length: 4 }, (_, trayIndex) => {
                          const location = `${sectionKey}${nicheIndex + 1}-${levelNumber}-${trayIndex + 1}`;
                          const palletData = palletsToRender.find(p => p.location === location);
                          return (
                            <PalletSpot
                              key={location}
                              location={location}
                              palletData={palletData}
                              spotLabel={`B${trayIndex + 1}`}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      // Regular case: 3 pallets per level
                      <div className="grid grid-cols-3 gap-1">
                        {Array.from({ length: 3 }, (_, palletIndex) => {
                          const location = `${sectionKey}${nicheIndex + 1}-${levelNumber}-${palletIndex + 1}`;
                          const palletData = palletsToRender.find(p => p.location === location);
                          return (
                            <PalletSpot
                              key={location}
                              location={location}
                              palletData={palletData}
                              spotLabel={`P${palletIndex + 1}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Visor de Almacén</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {Object.keys(sections).map(sectionKey => (
            <div key={sectionKey} className="space-y-4">
              <h3 className="text-center text-xl font-bold text-primary">Sección {sectionKey}</h3>
              {renderSection(sectionKey)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};