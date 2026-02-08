import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin";
import type { ApiCategory, ApiProduct, ApiProductVariant, ApiTag } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import DashboardOverview from "./DashboardOverview";
import InventoryTab from "./InventoryTab";
import ProductsTab from "./ProductsTab";
import TagsTab from "./TagsTab";
import CategoriesTab from "./CategoriesTab";
import PromotionsTab from "./PromotionsTab";
import OrdersTab from "./OrdersTab";
import UsersTab from "./UsersTab";

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

          {activeTab === "overview" && <DashboardOverview metrics={metrics} />}

          {activeTab === "inventory" && (
            <InventoryTab
              inventory={inventory}
              variants={variants}
              products={products}
              newVariant={newVariant}
              setNewVariant={setNewVariant}
              variantStockEdits={variantStockEdits}
              setVariantStockEdits={setVariantStockEdits}
              onCreateVariant={handleCreateVariant}
              onSaveVariantStock={handleSaveVariantStock}
            />
          )}

          {activeTab === "products" && (
            <ProductsTab
              products={products}
              categories={categories}
              tags={tags}
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              newProductImages={newProductImages}
              setNewProductImages={setNewProductImages}
              newProductModel={newProductModel}
              setNewProductModel={setNewProductModel}
              isPreviewOpen={isPreviewOpen}
              setIsPreviewOpen={setIsPreviewOpen}
              previewIndex={previewIndex}
              setPreviewIndex={setPreviewIndex}
              selectedTagInput={selectedTagInput}
              setSelectedTagInput={setSelectedTagInput}
              isCreatingProduct={isCreatingProduct}
              isEditOpen={isEditOpen}
              setIsEditOpen={setIsEditOpen}
              editForm={editForm}
              setEditForm={setEditForm}
              onCreateProduct={handleCreateProduct}
              onOpenEdit={handleOpenEdit}
              onSaveEdit={handleSaveEdit}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === "tags" && (
            <TagsTab
              tags={tags}
              newTag={newTag}
              setNewTag={setNewTag}
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
            />
          )}

          {activeTab === "categories" && (
            <CategoriesTab
              categories={categories}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              onCreateCategory={handleCreateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === "promotions" && (
            <PromotionsTab
              coupons={coupons}
              promotionRules={promotionRules}
              newCoupon={newCoupon}
              setNewCoupon={setNewCoupon}
              newRule={newRule}
              setNewRule={setNewRule}
              onCreateCoupon={handleCreateCoupon}
              onCreateRule={handleCreateRule}
            />
          )}

          {activeTab === "orders" && (
            <OrdersTab orders={orders} onRefundOrder={handleRefundOrder} />
          )}

          {activeTab === "users" && (
            <UsersTab users={users} onToggleUser={handleToggleUser} />
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
