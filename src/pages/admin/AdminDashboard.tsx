import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/admin";
import type { ApiProduct, ApiTag } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "products" | "promotions" | "orders" | "users"
  >("overview");

  const { data: metrics } = useQuery({ queryKey: ["admin-metrics"], queryFn: adminApi.metrics });
  const { data: inventory = [] } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: adminApi.lowInventory,
  });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: adminApi.products });
  const { data: tags = [] } = useQuery({ queryKey: ["admin-tags"], queryFn: adminApi.tags });
  const { data: coupons = [] } = useQuery({ queryKey: ["admin-coupons"], queryFn: adminApi.coupons });
  const { data: promotionRules = [] } = useQuery({
    queryKey: ["admin-promotion-rules"],
    queryFn: adminApi.promotionRules,
  });
  const { data: orders = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: adminApi.orders });

  const [newProduct, setNewProduct] = useState({
    title: "",
    slug: "",
    base_price: "",
    currency: "NGN",
    status: "active",
    tags: [] as number[],
  });
  const [newTag, setNewTag] = useState({ name: "", slug: "" });
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percent",
    value: "",
    max_uses: 0,
  });
  const [newRule, setNewRule] = useState({
    name: "",
    min_cart_value: "",
    discount_type: "percent",
    value: "",
  });

  const handleCreateProduct = async () => {
    if (!newProduct.title || !newProduct.slug || !newProduct.base_price) return;
    await adminApi.createProduct({
      title: newProduct.title,
      slug: newProduct.slug,
      base_price: newProduct.base_price,
      currency: newProduct.currency,
      status: newProduct.status,
      tags: newProduct.tags,
    } as Partial<ApiProduct>);
  };

  const handleCreateTag = async () => {
    if (!newTag.name) return;
    try {
      const created = await adminApi.createTag({
        name: newTag.name,
        ...(newTag.slug ? { slug: newTag.slug } : {}),
      } as Partial<ApiTag>);
      await queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
      setNewTag({ name: "", slug: "" });
      toast({
        title: "Tag added",
        description: `${created.name} has been created.`,
      });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({
        title: "Tag creation failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "inventory", label: "Inventory" },
    { id: "products", label: "Products" },
    { id: "promotions", label: "Promotions" },
    { id: "orders", label: "Orders" },
    { id: "users", label: "Users" },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <p className="swiss-subheading text-primary mb-2">Admin</p>
            <h1 className="swiss-heading text-foreground">Dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-3 mb-10">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === "overview" && (
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
          )}

          {activeTab === "inventory" && (
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
          )}

          {activeTab === "products" && (
            <div className="space-y-8">
              <div className="bg-secondary border border-border rounded-sm p-6">
                <h2 className="font-serif text-xl mb-4">Add product</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Title"
                    value={newProduct.title}
                    onChange={(event) =>
                      setNewProduct((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Slug"
                    value={newProduct.slug}
                    onChange={(event) =>
                      setNewProduct((prev) => ({ ...prev, slug: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Base price"
                    value={newProduct.base_price}
                    onChange={(event) =>
                      setNewProduct((prev) => ({ ...prev, base_price: event.target.value }))
                    }
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                    Tags
                  </label>
                  <select
                    multiple
                    value={newProduct.tags.map(String)}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map((option) =>
                        Number(option.value)
                      );
                      setNewProduct((prev) => ({ ...prev, tags: selected }));
                    }}
                    className="w-full h-32 bg-background border border-border rounded-md px-3 py-2 text-sm"
                  >
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button className="mt-4" onClick={handleCreateProduct}>
                  Create product
                </Button>
              </div>

              <div className="bg-secondary border border-border rounded-sm p-6">
                <h2 className="font-serif text-xl mb-4">Tags</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Tag name"
                    value={newTag.name}
                    onChange={(event) => setNewTag((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <Input
                    placeholder="Slug"
                    value={newTag.slug}
                    onChange={(event) => setNewTag((prev) => ({ ...prev, slug: event.target.value }))}
                  />
                </div>
                <Button className="mt-4" onClick={handleCreateTag}>
                  Add tag
                </Button>
                <Table className="mt-6">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>{tag.name}</TableCell>
                        <TableCell>{tag.slug}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-secondary border border-border rounded-sm p-6">
                <h2 className="font-serif text-xl mb-4">Products</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.status}</TableCell>
                        <TableCell>{product.base_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "promotions" && (
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
                  <Button onClick={() => adminApi.createCoupon(newCoupon)}>
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
                  <Button onClick={() => adminApi.createPromotionRule(newRule)}>
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
          )}

          {activeTab === "orders" && (
            <div className="bg-secondary border border-border rounded-sm p-6">
              <h2 className="font-serif text-xl mb-4">Orders</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{order.total}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adminApi.refundOrder(order.id)}
                        >
                          Refund
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-secondary border border-border rounded-sm p-6">
              <h2 className="font-serif text-xl mb-4">Users</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            adminApi.updateUser(user.id, { is_active: !user.is_active })
                          }
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
