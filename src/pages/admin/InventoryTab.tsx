import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiProduct, ApiProductVariant } from "@/lib/types";

export interface InventoryTabProps {
  inventory: any[];
  variants: ApiProductVariant[];
  products: ApiProduct[];
  newVariant: {
    product: string;
    name: string;
    sku: string;
    price: string;
    stock_quantity: string;
    is_active: boolean;
  };
  setNewVariant: React.Dispatch<
    React.SetStateAction<{
      product: string;
      name: string;
      sku: string;
      price: string;
      stock_quantity: string;
      is_active: boolean;
    }>
  >;
  variantStockEdits: Record<number, string>;
  setVariantStockEdits: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onCreateVariant: () => void;
  onSaveVariantStock: (variantId: number) => void;
}

const InventoryTab = ({
  inventory,
  variants,
  products,
  newVariant,
  setNewVariant,
  variantStockEdits,
  setVariantStockEdits,
  onCreateVariant,
  onSaveVariantStock,
}: InventoryTabProps) => {
  return (
    <div className="space-y-8">
      <div className="bg-secondary border border-border rounded-sm p-6">
        <h2 className="font-serif text-xl mb-4">Low inventory</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variant</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((variant: any) => (
              <TableRow key={variant.id}>
                <TableCell>{variant.name}</TableCell>
                <TableCell>{variant.stock_quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-secondary border border-border rounded-sm p-6">
        <h2 className="font-serif text-xl mb-4">Variants</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
              Product
            </label>
            <select
              value={newVariant.product}
              onChange={(event) =>
                setNewVariant((prev) => ({ ...prev, product: event.target.value }))
              }
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
              Price
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Variant price"
              value={newVariant.price}
              onChange={(event) =>
                setNewVariant((prev) => ({ ...prev, price: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
              Variant name
            </label>
            <Input
              placeholder="Variant name"
              value={newVariant.name}
              onChange={(event) =>
                setNewVariant((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
              Stock keeping unit
            </label>
            <Input
              placeholder="SKU"
              value={newVariant.sku}
              onChange={(event) =>
                setNewVariant((prev) => ({ ...prev, sku: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
              Stock quantity
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Stock quantity"
              value={newVariant.stock_quantity}
              onChange={(event) =>
                setNewVariant((prev) => ({ ...prev, stock_quantity: event.target.value }))
              }
            />
          </div>
        </div>
        <Button className="mt-4" onClick={onCreateVariant}>
          Add variant
        </Button>

        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => {
              const product = products.find((item) => item.id === variant.product);
              return (
                <TableRow key={variant.id}>
                  <TableCell>{product?.title ?? variant.product}</TableCell>
                  <TableCell>{variant.name}</TableCell>
                  <TableCell>{variant.sku}</TableCell>
                  <TableCell>{variant.price}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        variantStockEdits[variant.id] ?? String(variant.stock_quantity)
                      }
                      onChange={(event) =>
                        setVariantStockEdits((prev) => ({
                          ...prev,
                          [variant.id]: event.target.value,
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSaveVariantStock(variant.id)}
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InventoryTab;
