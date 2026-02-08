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
import type { Coupon, PromotionRule } from "@/lib/admin";

export interface PromotionsTabProps {
  coupons: Coupon[];
  promotionRules: PromotionRule[];
  newCoupon: {
    code: string;
    discount_type: "percent" | "fixed";
    value: string;
    max_uses: number;
  };
  setNewCoupon: React.Dispatch<
    React.SetStateAction<{
      code: string;
      discount_type: "percent" | "fixed";
      value: string;
      max_uses: number;
    }>
  >;
  newRule: {
    name: string;
    min_cart_value: string;
    discount_type: "percent" | "fixed";
    value: string;
  };
  setNewRule: React.Dispatch<
    React.SetStateAction<{
      name: string;
      min_cart_value: string;
      discount_type: "percent" | "fixed";
      value: string;
    }>
  >;
  onCreateCoupon: () => void;
  onCreateRule: () => void;
}

const PromotionsTab = ({
  coupons,
  promotionRules,
  newCoupon,
  setNewCoupon,
  newRule,
  setNewRule,
  onCreateCoupon,
  onCreateRule,
}: PromotionsTabProps) => {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-secondary border border-border rounded-sm p-6">
        <h2 className="font-serif text-xl mb-4">Coupons</h2>
        <div className="space-y-3">
          <Input
            placeholder="Code"
            value={newCoupon.code}
            onChange={(event) =>
              setNewCoupon((prev) => ({ ...prev, code: event.target.value }))
            }
          />
          <Input
            placeholder="Value"
            value={newCoupon.value}
            onChange={(event) =>
              setNewCoupon((prev) => ({ ...prev, value: event.target.value }))
            }
          />
          <Button onClick={onCreateCoupon}>
            Create coupon
          </Button>
        </div>
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>{coupon.code}</TableCell>
                <TableCell>{coupon.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-secondary border border-border rounded-sm p-6">
        <h2 className="font-serif text-xl mb-4">Promotion rules</h2>
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={newRule.name}
            onChange={(event) =>
              setNewRule((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <Input
            placeholder="Min cart value"
            value={newRule.min_cart_value}
            onChange={(event) =>
              setNewRule((prev) => ({ ...prev, min_cart_value: event.target.value }))
            }
          />
          <Input
            placeholder="Value"
            value={newRule.value}
            onChange={(event) =>
              setNewRule((prev) => ({ ...prev, value: event.target.value }))
            }
          />
          <Button onClick={onCreateRule}>
            Create rule
          </Button>
        </div>
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotionRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>{rule.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PromotionsTab;
