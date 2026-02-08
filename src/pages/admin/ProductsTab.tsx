import { useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiCategory, ApiProduct, ApiTag } from "@/lib/types";

export interface ProductsTabProps {
  products: ApiProduct[];
  categories: ApiCategory[];
  tags: ApiTag[];
  newProduct: {
    title: string;
    slug: string;
    base_price: string;
    currency: string;
    status: string;
    tags: number[];
    category: string;
  };
  setNewProduct: React.Dispatch<
    React.SetStateAction<{
      title: string;
      slug: string;
      base_price: string;
      currency: string;
      status: string;
      tags: number[];
      category: string;
    }>
  >;
  newProductImages: File[];
  setNewProductImages: React.Dispatch<React.SetStateAction<File[]>>;
  newProductModel: File | null;
  setNewProductModel: React.Dispatch<React.SetStateAction<File | null>>;
  isPreviewOpen: boolean;
  setIsPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  previewIndex: number;
  setPreviewIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedTagInput: string;
  setSelectedTagInput: React.Dispatch<React.SetStateAction<string>>;
  isCreatingProduct: boolean;
  isEditOpen: boolean;
  setIsEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editForm: {
    title: string;
    slug: string;
    base_price: string;
    status: string;
    category: string;
    tags: number[];
  };
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      slug: string;
      base_price: string;
      status: string;
      category: string;
      tags: number[];
    }>
  >;
  onCreateProduct: () => void;
  onOpenEdit: (product: ApiProduct) => void;
  onSaveEdit: () => void;
  onDeleteProduct: (id: number) => void;
}

const ProductsTab = ({
  products,
  categories,
  tags,
  newProduct,
  setNewProduct,
  newProductImages,
  setNewProductImages,
  newProductModel,
  setNewProductModel,
  isPreviewOpen,
  setIsPreviewOpen,
  previewIndex,
  setPreviewIndex,
  selectedTagInput,
  setSelectedTagInput,
  isCreatingProduct,
  isEditOpen,
  setIsEditOpen,
  editForm,
  setEditForm,
  onCreateProduct,
  onOpenEdit,
  onSaveEdit,
  onDeleteProduct,
}: ProductsTabProps) => {
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

  return (
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

        <Button className="mt-4" onClick={onCreateProduct} disabled={isCreatingProduct}>
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
              <Button onClick={onSaveEdit}>Save changes</Button>
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
                  <Button size="sm" variant="outline" onClick={() => onOpenEdit(product)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteProduct(product.id)}
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
  );
};

export default ProductsTab;
