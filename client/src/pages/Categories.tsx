import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function Categories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#6b7280",
    icon: "📦",
  });

  const { data: categories, refetch } = trpc.categories.list.useQuery();
  const createMutation = trpc.categories.create.useMutation();
  const deleteMutation = trpc.categories.delete.useMutation();
  const initializeDefaultsMutation = trpc.categories.initializeDefaults.useMutation();

  const handleOpenDialog = () => {
    setFormData({
      name: "",
      type: "expense",
      color: "#6b7280",
      icon: "📦",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Por favor ingresa un nombre para la categoría");
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success("Categoría creada correctamente");
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Error al crear la categoría");
    }
  };

  const handleDelete = async (id: number, isDefault: boolean) => {
    if (isDefault) {
      toast.error("No puedes eliminar categorías predeterminadas");
      return;
    }

    if (confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Categoría eliminada correctamente");
        refetch();
      } catch (error) {
        toast.error("Error al eliminar la categoría");
      }
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultsMutation.mutateAsync();
      toast.success("Categorías predeterminadas inicializadas");
      refetch();
    } catch (error) {
      toast.error("Error al inicializar categorías");
    }
  };

  const incomeCategories = categories?.filter((c: any) => c.type === "income") || [];
  const expenseCategories = categories?.filter((c: any) => c.type === "expense") || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorías</h1>
          <p className="text-muted-foreground mt-1">Gestiona las categorías de tus transacciones</p>
        </div>
        <div className="flex space-x-2">
          {categories?.length === 0 && (
            <Button variant="outline" onClick={handleInitializeDefaults}>
              Inicializar Predeterminadas
            </Button>
          )}
          <Button onClick={handleOpenDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Income Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Categorías de Ingresos
          </CardTitle>
          <CardDescription>{incomeCategories.length} categorías</CardDescription>
        </CardHeader>
        <CardContent>
          {incomeCategories.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incomeCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                  style={{ borderLeftWidth: "4px", borderLeftColor: category.color }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      {category.isDefault && (
                        <p className="text-xs text-muted-foreground">Predeterminada</p>
                      )}
                    </div>
                  </div>
                  {!category.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id, category.isDefault)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay categorías de ingresos
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
            Categorías de Gastos
          </CardTitle>
          <CardDescription>{expenseCategories.length} categorías</CardDescription>
        </CardHeader>
        <CardContent>
          {expenseCategories.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expenseCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                  style={{ borderLeftWidth: "4px", borderLeftColor: category.color }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      {category.isDefault && (
                        <p className="text-xs text-muted-foreground">Predeterminada</p>
                      )}
                    </div>
                  </div>
                  {!category.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id, category.isDefault)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay categorías de gastos
            </div>
          )}
        </CardContent>
      </Card>

      {categories?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tienes categorías</h3>
            <p className="text-muted-foreground mb-4">
              Inicializa las categorías predeterminadas o crea las tuyas propias
            </p>
            <div className="flex justify-center space-x-2">
              <Button onClick={handleInitializeDefaults}>Inicializar Predeterminadas</Button>
              <Button variant="outline" onClick={handleOpenDialog}>
                Crear Personalizada
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>Crea una categoría personalizada para tus transacciones</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Freelance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "income" | "expense") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icono (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📦"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
