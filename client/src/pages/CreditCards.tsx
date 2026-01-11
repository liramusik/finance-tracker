import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function CreditCards() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    bankName: "",
    lastFourDigits: "",
    creditLimit: 0,
    currentBalance: 0,
    closingDay: 1,
    paymentDueDay: 15,
    currency: "USD",
    color: "#ef4444",
  });

  const { data: creditCards, refetch } = trpc.creditCards.list.useQuery();
  const createMutation = trpc.creditCards.create.useMutation();
  const updateMutation = trpc.creditCards.update.useMutation();
  const deleteMutation = trpc.creditCards.delete.useMutation();
  const utils = trpc.useUtils();

  const handleOpenDialog = (card?: any) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        name: card.name,
        bankName: card.bankName,
        lastFourDigits: card.lastFourDigits || "",
        creditLimit: Number(card.creditLimit),
        currentBalance: Number(card.currentBalance),
        closingDay: card.closingDay || 1,
        paymentDueDay: card.paymentDueDay || 15,
        currency: card.currency,
        color: card.color || "#ef4444",
      });
    } else {
      setEditingCard(null);
      setFormData({
        name: "",
        bankName: "",
        lastFourDigits: "",
        creditLimit: 0,
        currentBalance: 0,
        closingDay: 1,
        paymentDueDay: 15,
        currency: "USD",
        color: "#ef4444",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.bankName) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      if (editingCard) {
        await updateMutation.mutateAsync({
          id: editingCard.id,
          ...formData,
        });
        toast.success("Tarjeta actualizada correctamente");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Tarjeta creada correctamente");
      }
      setIsDialogOpen(false);
      refetch();
      utils.transactions.summary.invalidate();
    } catch (error) {
      toast.error("Error al guardar la tarjeta");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta tarjeta?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Tarjeta eliminada correctamente");
        refetch();
        utils.transactions.summary.invalidate();
      } catch (error) {
        toast.error("Error al eliminar la tarjeta");
      }
    }
  };

  const totalDebt = creditCards?.reduce((sum, card) => sum + Number(card.currentBalance), 0) || 0;
  const totalLimit = creditCards?.reduce((sum, card) => sum + Number(card.creditLimit), 0) || 0;
  const totalAvailable = creditCards?.reduce((sum, card) => sum + Number(card.availableCredit), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tarjetas de Crédito</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus tarjetas de crédito y límites</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarjeta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deuda Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalDebt.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Límite Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${totalLimit.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crédito Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalAvailable.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {creditCards?.map((card) => {
          const usagePercent = (Number(card.currentBalance) / Number(card.creditLimit)) * 100;
          const isHighUsage = usagePercent > 70;

          return (
            <Card key={card.id} className="border-l-4" style={{ borderLeftColor: card.color || "#ef4444" }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: card.color || "#ef4444" }}
                    >
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <CardDescription>{card.bankName}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {card.lastFourDigits && (
                    <div className="font-mono text-lg">**** **** **** {card.lastFourDigits}</div>
                  )}
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Balance Actual</span>
                      <span className="font-semibold text-red-600">
                        ${Number(card.currentBalance).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Límite de Crédito</span>
                      <span className="font-medium">
                        ${Number(card.creditLimit).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Progress value={usagePercent} className="h-2" />
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-muted-foreground">{usagePercent.toFixed(1)}% utilizado</span>
                      {isHighUsage && (
                        <span className="flex items-center text-orange-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Alto uso
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <div>
                      <p className="text-muted-foreground">Corte</p>
                      <p className="font-medium">Día {card.closingDay}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pago</p>
                      <p className="font-medium">Día {card.paymentDueDay}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(card)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(card.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {creditCards?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tienes tarjetas registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza agregando tu primera tarjeta de crédito</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Tarjeta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCard ? "Editar Tarjeta" : "Nueva Tarjeta"}</DialogTitle>
            <DialogDescription>
              {editingCard ? "Actualiza la información de tu tarjeta" : "Agrega una nueva tarjeta de crédito"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Tarjeta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Tarjeta Oro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Banco *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Ej: Banco Nacional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastFourDigits">Últimos 4 Dígitos</Label>
              <Input
                id="lastFourDigits"
                value={formData.lastFourDigits}
                onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.slice(0, 4) })}
                placeholder="1234"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Límite de Crédito</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentBalance">Balance Actual</Label>
              <Input
                id="currentBalance"
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="closingDay">Día de Corte</Label>
                <Input
                  id="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.closingDay}
                  onChange={(e) => setFormData({ ...formData, closingDay: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDueDay">Día de Pago</Label>
                <Input
                  id="paymentDueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDueDay}
                  onChange={(e) => setFormData({ ...formData, paymentDueDay: parseInt(e.target.value) || 15 })}
                />
              </div>
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
            <Button onClick={handleSubmit}>
              {editingCard ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
