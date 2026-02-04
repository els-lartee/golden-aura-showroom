import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/admin";
import type { ApiCategory, ApiProduct, ApiProductVariant, ApiTag } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "inventory"
    | "products"
    | "tags"
    | "categories"
    | "promotions"
    | "orders"
    | "users"
  >("overview");

  const { data: metrics } = useQuery({ queryKey: ["admin-metrics"], queryFn: adminApi.metrics });
  const { data: inventory = [] } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: adminApi.lowInventory,
  });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: adminApi.products });
  const { data: variants = [] } = useQuery({ queryKey: ["admin-variants"], queryFn: adminApi.variants });
  const { data: tags = [] } = useQuery({ queryKey: ["admin-tags"], queryFn: adminApi.tags });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: adminApi.categories,
  });
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
    category: "",
  });
  const [newProductImages, setNewProductImages] = useState<File[]>([]);
  const [newProductModel, setNewProductModel] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedTagInput, setSelectedTagInput] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    base_price: "",
    status: "active",
    category: "",
    tags: [] as number[],
  });

  const imagePreviews = useMemo(
    () =>
      newProductImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [newProductImages],
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);
  const [newTag, setNewTag] = useState({ name: "", slug: "" });
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    discount_type: "percent" | "fixed";
    value: string;
    max_uses: number;
  }>({
    code: "",
    discount_type: "percent",
    value: "",
    max_uses: 0,
  });
  const [newRule, setNewRule] = useState<{
    name: string;
    min_cart_value: string;
    discount_type: "percent" | "fixed";
    value: string;
  }>({
    name: "",
    min_cart_value: "",
    discount_type: "percent",
    value: "",
  });
  const [newVariant, setNewVariant] = useState({
    product: "",
    name: "",
    sku: "",
    price: "",
    stock_quantity: "0",
    is_active: true,
  });
  const [variantStockEdits, setVariantStockEdits] = useState<Record<number, string>>({});

  const handleCreateProduct = async () => {
    const priceValue = Number(newProduct.base_price);
    if (!newProduct.title || !newProduct.slug || !newProduct.base_price) {
      toast({
        title: "Missing details",
        description: "Title, slug, and base price are required.",
        variant: "destructive",
      });
      return;
    }
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Invalid price",
        description: "Base price must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    if (newProductImages.length === 0) {
      toast({
        title: "Missing images",
        description: "Please upload at least one product image.",
        variant: "destructive",
      });
      return;
    }
    if (!newProductModel) {
      toast({
        title: "Missing 3D model",
        description: "Please upload a .glb model file.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsCreatingProduct(true);
      const created = await adminApi.createProduct({
        title: newProduct.title,
        slug: newProduct.slug,
        base_price: newProduct.base_price,
        currency: newProduct.currency,
        status: newProduct.status,
        tags: newProduct.tags,
        category: newProduct.category ? Number(newProduct.category) : null,
      } as Partial<ApiProduct>);

      const uploadTasks: Promise<unknown>[] = [];
      newProductImages.forEach((file, index) => {
        const formData = new FormData();
        formData.append("product", String(created.id));
        formData.append("media_type", "image");
        formData.append("file", file);
        formData.append("alt_text", file.name);
        formData.append("sort_order", String(index));
        if (index === 0) {
          formData.append("is_primary", "true");
        }
        uploadTasks.push(adminApi.createProductMedia(formData));
      });

      if (newProductModel) {
        const formData = new FormData();
        formData.append("product", String(created.id));
        formData.append("media_type", "model");
        formData.append("file", newProductModel);
        formData.append("alt_text", newProductModel.name);
        uploadTasks.push(adminApi.createProductMedia(formData));
      }

      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setNewProduct({
        title: "",
        slug: "",
        base_price: "",
        currency: "NGN",
        status: "active",
        tags: [],
        category: "",
      });
      setSelectedTagInput("");
      setNewProductImages([]);
      setNewProductModel(null);
      setIsPreviewOpen(false);
      setPreviewIndex(0);
      toast({ title: "Product created", description: `${created.title} is ready.` });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Product creation failed", description: message, variant: "destructive" });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleOpenEdit = (product: ApiProduct) => {
    setEditingProductId(product.id);
    setEditForm({
      title: product.title,
      slug: product.slug,
      base_price: product.base_price,
      status: product.status,
      category: product.category ? String(product.category) : "",
      tags: product.tags ?? [],
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProductId) return;
    const priceValue = Number(editForm.base_price);
    if (!editForm.title || !editForm.slug || !editForm.base_price) {
      toast({
        title: "Missing details",
        description: "Title, slug, and base price are required.",
        variant: "destructive",
      });
      return;
    }
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Invalid price",
        description: "Base price must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    try {
      await adminApi.updateProduct(editingProductId, {
        title: editForm.title,
        slug: editForm.slug,
        base_price: editForm.base_price,
        status: editForm.status,
        category: editForm.category ? Number(editForm.category) : null,
        tags: editForm.tags,
      } as Partial<ApiProduct>);

      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product updated" });
      setIsEditOpen(false);
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await adminApi.deleteProduct(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted" });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  const handleCreateVariant = async () => {
    if (!newVariant.product || !newVariant.name || !newVariant.sku || !newVariant.price) {
      toast({
        title: "Missing details",
        description: "Product, name, SKU, and price are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      await adminApi.createVariant({
        product: Number(newVariant.product),
        name: newVariant.name,
        sku: newVariant.sku,
        price: newVariant.price,
        stock_quantity: Number(newVariant.stock_quantity || 0),
        is_active: newVariant.is_active,
      } as Partial<ApiProductVariant>);
      await queryClient.invalidateQueries({ queryKey: ["admin-variants"] });
      setNewVariant({ product: "", name: "", sku: "", price: "", stock_quantity: "0", is_active: true });
      toast({ title: "Variant created" });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Variant creation failed", description: message, variant: "destructive" });
    }
  };

  const handleSaveVariantStock = async (variantId: number) => {
    const value = variantStockEdits[variantId];
    if (value === undefined) return;
    const stockValue = Number(value);
    if (Number.isNaN(stockValue) || stockValue < 0) {
      toast({
        title: "Invalid stock",
        description: "Stock must be 0 or higher.",
        variant: "destructive",
      });
      return;
    }
    try {
      await adminApi.updateVariant(variantId, { stock_quantity: stockValue });
      await queryClient.invalidateQueries({ queryKey: ["admin-variants"] });
      toast({ title: "Stock updated" });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Stock update failed", description: message, variant: "destructive" });
    }
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

  const handleDeleteTag = async (id: number) => {
    try {
      await adminApi.deleteTag(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
      toast({ title: "Tag deleted" });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await adminApi.deleteCategory(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Category deleted" });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  const handleCreateCoupon = async () => {
    try {
      const created = await adminApi.createCoupon(newCoupon);
      await queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      setNewCoupon({ code: "", discount_type: "percent", value: "", max_uses: 0 });
      toast({ title: "Coupon created", description: created.code });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Coupon creation failed", description: message, variant: "destructive" });
    }
  };

  const handleCreateRule = async () => {
    try {
      const created = await adminApi.createPromotionRule(newRule);
      await queryClient.invalidateQueries({ queryKey: ["admin-promotion-rules"] });
      setNewRule({ name: "", min_cart_value: "", discount_type: "percent", value: "" });
      toast({ title: "Rule created", description: created.name });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Rule creation failed", description: message, variant: "destructive" });
    }
  };

  const handleRefundOrder = async (id: number) => {
    try {
      await adminApi.refundOrder(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Refund queued" });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Refund failed", description: message, variant: "destructive" });
    }
  };

  const handleToggleUser = async (id: number, isActive: boolean) => {
    try {
      await adminApi.updateUser(id, { is_active: !isActive });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: isActive ? "User deactivated" : "User activated" });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name) return;
    try {
      const created = await adminApi.createCategory({
        name: newCategory.name,
        ...(newCategory.slug ? { slug: newCategory.slug } : {}),
      } as Partial<ApiCategory>);
      await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setNewCategory({ name: "", slug: "" });
      toast({
        title: "Category added",
        description: `${created.name} has been created.`,
      });
    } catch (error) {
      const message = (error as { message?: string })?.message || "Request failed";
      toast({
        title: "Category creation failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "inventory", label: "Inventory / Variants" },
    { id: "products", label: "Products" },
    { id: "tags", label: "Tags" },
    { id: "categories", label: "Categories" },
    { id: "promotions", label: "Promotions" },
    { id: "orders", label: "Orders" },
    { id: "users", label: "Users" },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="pt-24 pb-16 flex-1">
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
                      onChange={(event) => setNewVariant((prev) => ({ ...prev, product: event.target.value }))}
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
                      onChange={(event) => setNewVariant((prev) => ({ ...prev, price: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Variant name
                    </label>
                    <Input
                      placeholder="Variant name"
                      value={newVariant.name}
                      onChange={(event) => setNewVariant((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Stock keeping unit
                    </label>
                    <Input
                      placeholder="SKU"
                      value={newVariant.sku}
                      onChange={(event) => setNewVariant((prev) => ({ ...prev, sku: event.target.value }))}
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
                <Button className="mt-4" onClick={handleCreateVariant}>
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
                              onClick={() => handleSaveVariantStock(variant.id)}
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
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Base price"
                    value={newProduct.base_price}
                    onChange={(event) =>
                      setNewProduct((prev) => ({ ...prev, base_price: event.target.value }))
                    }
                  />
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Category
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(event) =>
                        setNewProduct((prev) => ({ ...prev, category: event.target.value }))
                      }
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">No category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Tags
                    </label>
                    <select
                      value={selectedTagInput}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (!value) return;
                        const tagId = Number(value);
                        setNewProduct((prev) =>
                          prev.tags.includes(tagId)
                            ? prev
                            : { ...prev, tags: [...prev.tags, tagId] }
                        );
                        setSelectedTagInput("");
                      }}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select a tag</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                    {newProduct.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {newProduct.tags.map((tagId) => {
                          const tag = tags.find((item) => item.id === tagId);
                          if (!tag) return null;
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs"
                              onClick={() =>
                                setNewProduct((prev) => ({
                                  ...prev,
                                  tags: prev.tags.filter((id) => id !== tag.id),
                                }))
                              }
                            >
                              {tag.name}
                              <span className="text-muted-foreground">×</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      Product images
                    </label>
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(event) => {
                        const files = event.target.files ? Array.from(event.target.files) : [];
                        if (files.length === 0) return;
                        setNewProductImages((prev) => [...prev, ...files]);
                        event.currentTarget.value = "";
                      }}
                    />
                    {imagePreviews.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-3">
                          {imagePreviews.length} image(s) selected
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {imagePreviews.map((preview, index) => (
                            <button
                              key={preview.url}
                              type="button"
                              onClick={() => {
                                setPreviewIndex(index);
                                setIsPreviewOpen(true);
                              }}
                              className="group relative aspect-square overflow-hidden rounded-md border border-border"
                            >
                              <img
                                src={preview.url}
                                alt={preview.file.name}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                              <span className="sr-only">Preview {preview.file.name}</span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setNewProductImages((prev) => prev.filter((_, i) => i !== index));
                                  setPreviewIndex((current) =>
                                    current > index
                                      ? current - 1
                                      : Math.min(current, imagePreviews.length - 2)
                                  );
                                }}
                                className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                      3D model (.glb)
                    </label>
                    <Input
                      type="file"
                      accept=".glb"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setNewProductModel(file);
                      }}
                    />
                    {newProductModel && (
                      <p className="mt-2 text-xs text-muted-foreground">{newProductModel.name}</p>
                    )}
                  </div>
                </div>

                <Button className="mt-4" onClick={handleCreateProduct} disabled={isCreatingProduct}>
                  Create product
                </Button>
              </div>

              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-3xl p-0 bg-background">
                  {imagePreviews[previewIndex] && (
                    <div className="relative">
                      <img
                        src={imagePreviews[previewIndex].url}
                        alt={imagePreviews[previewIndex].file.name}
                        className="max-h-[70vh] w-full object-contain bg-black"
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <Button
                          variant="ghost"
                          className="h-10 w-10 rounded-full bg-background/80"
                          onClick={() =>
                            setPreviewIndex((prev) =>
                              prev === 0 ? imagePreviews.length - 1 : prev - 1
                            )
                          }
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-10 w-10 rounded-full bg-background/80"
                          onClick={() =>
                            setPreviewIndex((prev) =>
                              prev === imagePreviews.length - 1 ? 0 : prev + 1
                            )
                          }
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        className="absolute left-4 top-4 h-10 w-10 rounded-full p-0"
                        onClick={() => {
                          setNewProductImages((prev) => prev.filter((_, i) => i !== previewIndex));
                          setPreviewIndex((prev) =>
                            prev >= imagePreviews.length - 1 ? Math.max(0, prev - 1) : prev
                          );
                          if (imagePreviews.length <= 1) {
                            setIsPreviewOpen(false);
                          }
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                      <div className="absolute bottom-4 left-4 rounded-md bg-background/80 px-3 py-1 text-xs">
                        {previewIndex + 1} / {imagePreviews.length}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Edit product</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Title"
                        value={editForm.title}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                      <Input
                        placeholder="Slug"
                        value={editForm.slug}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, slug: event.target.value }))
                        }
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Base price"
                        value={editForm.base_price}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, base_price: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                          Category
                        </label>
                        <select
                          value={editForm.category}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, category: event.target.value }))
                          }
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                        >
                          <option value="">No category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                          Tags
                        </label>
                        <select
                          value=""
                          onChange={(event) => {
                            const value = event.target.value;
                            if (!value) return;
                            const tagId = Number(value);
                            setEditForm((prev) =>
                              prev.tags.includes(tagId)
                                ? prev
                                : { ...prev, tags: [...prev.tags, tagId] }
                            );
                          }}
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                        >
                          <option value="">Select a tag</option>
                          {tags.map((tag) => (
                            <option key={tag.id} value={tag.id}>
                              {tag.name}
                            </option>
                          ))}
                        </select>
                        {editForm.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {editForm.tags.map((tagId) => {
                              const tag = tags.find((item) => item.id === tagId);
                              if (!tag) return null;
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs"
                                  onClick={() =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      tags: prev.tags.filter((id) => id !== tag.id),
                                    }))
                                  }
                                >
                                  {tag.name}
                                  <span className="text-muted-foreground">×</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit}>Save changes</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="bg-secondary border border-border rounded-sm p-6">
                <h2 className="font-serif text-xl mb-4">Products</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>{product.status}</TableCell>
                        <TableCell>{product.base_price}</TableCell>
                        <TableCell>{product.variants?.[0]?.stock_quantity ?? "—"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleOpenEdit(product)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

            </div>
          )}

          {activeTab === "tags" && (
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>{tag.name}</TableCell>
                      <TableCell>{tag.slug}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="bg-secondary border border-border rounded-sm p-6">
              <h2 className="font-serif text-xl mb-4">Categories</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(event) =>
                    setNewCategory((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Input
                  placeholder="Slug"
                  value={newCategory.slug}
                  onChange={(event) =>
                    setNewCategory((prev) => ({ ...prev, slug: event.target.value }))
                  }
                />
              </div>
              <Button className="mt-4" onClick={handleCreateCategory}>
                Add category
              </Button>
              <Table className="mt-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <Button onClick={handleCreateCoupon}>
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
                  <Button onClick={handleCreateRule}>
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
                          onClick={() => handleRefundOrder(order.id)}
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
                          onClick={() => handleToggleUser(user.id, user.is_active)}
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
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;
