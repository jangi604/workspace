import { useState } from "react";
import { usePackages, useCreatePackage, useUpdatePackage, useDeletePackage } from "@/lib/api";
import { type InternetPackage } from "@workspace/firebase-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";

export default function Packages() {
  const { data: packages = [], isLoading } = usePackages();
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const deleteMutation = useDeletePackage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<InternetPackage | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    speedMbps: "",
    validityDays: "",
    price: "",
    description: "",
    isActive: true,
  });

  const handleOpenDialog = (pkg?: InternetPackage) => {
    if (pkg) {
      setEditingPkg(pkg);
      setFormData({
        name: pkg.name,
        speedMbps: String(pkg.speedMbps),
        validityDays: String(pkg.validityDays),
        price: String(pkg.price),
        description: pkg.description,
        isActive: pkg.isActive,
      });
    } else {
      setEditingPkg(null);
      setFormData({
        name: "",
        speedMbps: "",
        validityDays: "30",
        price: "",
        description: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      speedMbps: Number(formData.speedMbps),
      validityDays: Number(formData.validityDays),
      price: Number(formData.price),
      description: formData.description,
      isActive: formData.isActive,
    };

    if (editingPkg) {
      updateMutation.mutate(
        { id: editingPkg.id, data: payload },
        { onSuccess: () => setIsDialogOpen(false) }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setIsDialogOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this package?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleStatus = (pkg: InternetPackage) => {
    updateMutation.mutate({ id: pkg.id, data: { isActive: !pkg.isActive } });
  };

  if (isLoading) return <div className="animate-pulse flex gap-4 flex-col"><div className="h-10 w-32 bg-muted rounded" /><div className="h-[400px] w-full bg-muted rounded" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Internet Packages</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage the plans shown to customers in the mobile app.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Package
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No packages defined yet.
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">
                    {pkg.name}
                    <div className="text-xs text-muted-foreground font-normal line-clamp-1 max-w-xs">{pkg.description}</div>
                  </TableCell>
                  <TableCell>{pkg.speedMbps} Mbps</TableCell>
                  <TableCell>{pkg.validityDays} Days</TableCell>
                  <TableCell className="font-medium text-primary">{formatCurrency(pkg.price)}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleStatus(pkg)} className="focus:outline-none focus-visible:ring-2 rounded ring-ring ring-offset-background">
                      {pkg.isActive ? (
                        <Badge variant="success" className="gap-1.5"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1.5 text-muted-foreground"><XCircle className="h-3 w-3" /> Inactive</Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pkg)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)} className="hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Edit Package" : "Create New Package"}</DialogTitle>
            <DialogDescription>
              Configure the details of this internet package.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Starter Pack" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speed">Speed (Mbps)</Label>
                <Input id="speed" type="number" min="1" required value={formData.speedMbps} onChange={(e) => setFormData({...formData, speedMbps: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR)</Label>
                <Input id="price" type="number" min="0" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity">Validity (Days)</Label>
              <Input id="validity" type="number" min="1" required value={formData.validityDays} onChange={(e) => setFormData({...formData, validityDays: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Key features of this package..." />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="rounded border-input text-primary focus:ring-primary h-4 w-4" />
              Active (visible to customers)
            </label>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
