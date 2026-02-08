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
import type { ApiTag } from "@/lib/types";

export interface TagsTabProps {
  tags: ApiTag[];
  newTag: { name: string; slug: string };
  setNewTag: React.Dispatch<React.SetStateAction<{ name: string; slug: string }>>;
  onCreateTag: () => void;
  onDeleteTag: (id: number) => void;
}

const TagsTab = ({ tags, newTag, setNewTag, onCreateTag, onDeleteTag }: TagsTabProps) => {
  return (
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
      <Button className="mt-4" onClick={onCreateTag}>
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
                  onClick={() => onDeleteTag(tag.id)}
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

export default TagsTab;
