import type { FC } from 'react';

interface StockStatusProps {
  quantity: number;
  minQuantity: number;
}

export const StockStatus: FC<StockStatusProps> = ({ quantity, minQuantity }) => {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Tugagan
      </span>
    );
  }

  if (quantity <= minQuantity) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Kam qolgan
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Mavjud
    </span>
  );
};
