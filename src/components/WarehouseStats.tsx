import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WarehouseStats } from "@/types/warehouse";

interface WarehouseStatsProps {
  stats: WarehouseStats;
}

export const WarehouseStatsCard = ({ stats }: WarehouseStatsProps) => {
  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Estadísticas del Inventario</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-secondary rounded-md text-center">
            <p className="text-sm text-muted-foreground font-medium">Palets Totales</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.totalPallets}</p>
          </div>
          <div className="p-4 bg-secondary rounded-md text-center">
            <p className="text-sm text-muted-foreground font-medium">Artículos Totales</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.totalQuantity}</p>
          </div>
          <div className="p-4 bg-secondary rounded-md text-center">
            <p className="text-sm text-muted-foreground font-medium">Espacios Vacíos</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.emptySpots}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};