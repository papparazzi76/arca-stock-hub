export interface Pallet {
  id?: string;
  qrCode: string;
  description: string;
  quantity: number;
  location: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WarehouseStats {
  totalPallets: number;
  totalQuantity: number;
  emptySpots: number;
}

export interface LastAction {
  type: 'register' | 'remove' | 'update';
  id?: string;
  qrCode?: string;
  data?: Pallet;
  oldData?: Pallet;
}

export interface WarehouseSections {
  A: number;
  B: number;
  C: number;
  D: number;
}