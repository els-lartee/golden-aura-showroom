import type { AdminMetrics } from "@/lib/admin";

export interface DashboardOverviewProps {
  metrics: AdminMetrics | undefined;
}

const DashboardOverview = ({ metrics }: DashboardOverviewProps) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-secondary border border-border p-6 rounded-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Orders</p>
        <p className="text-2xl font-semibold">{metrics?.total_orders ?? 0}</p>
      </div>
      <div className="bg-secondary border border-border p-6 rounded-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Revenue</p>
        <p className="text-2xl font-semibold">{metrics?.total_revenue ?? 0}</p>
      </div>
      <div className="bg-secondary border border-border p-6 rounded-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Customers</p>
        <p className="text-2xl font-semibold">{metrics?.total_customers ?? 0}</p>
      </div>
      <div className="bg-secondary border border-border p-6 rounded-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Products</p>
        <p className="text-2xl font-semibold">{metrics?.total_products ?? 0}</p>
      </div>
      <div className="bg-secondary border border-border p-6 rounded-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Low inventory</p>
        <p className="text-2xl font-semibold">{metrics?.low_inventory_variants ?? 0}</p>
      </div>
    </div>
  );
};

export default DashboardOverview;
