import { Trash2 } from "lucide-react";

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
import type { ApiCategory } from "@/lib/types";

export interface CategoriesTabProps {
  categories: ApiCategory[];
  newCategory: { name: string; slug: string };
  setNewCategory: React.Dispatch<React.SetStateAction<{ name: string; slug: string }>>;
  onCreateCategory: () => void;
  onDeleteCategory: (id: number) => void;
}

const CategoriesTab = ({
  categories,
  newCategory,
  setNewCategory,
  onCreateCategory,
  onDeleteCategory,
}: CategoriesTabProps) => {
  return (
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
      <Button className="mt-4" onClick={onCreateCategory}>
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
                  onClick={() => onDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CategoriesTab;
