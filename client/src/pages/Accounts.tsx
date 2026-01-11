import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function Accounts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    bankName: "",
    accountNumber: "",
    accountType: "checking" as "checking" | "savings" | "investment",
    balance: 0,
    currency: "USD",
    color: "#3b82f6",
  });

  const { data: accounts, refetch } = trpc.accounts.list.useQuery();
  const createMutation = trpc.accounts.create.useMutation();
  const updateMutation = trpc.accounts.update.useMutation();
  const deleteMutation = trpc.accounts.delete.useMutation();
  const utils = trpc.useUtils();

  const handleOpenDialog = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        bankName: account.bankName,
        accountNumber: account.accountNumber || "",
        accountType: account.accountType,
        balance: Number(account.balance),
        currency: account.currency,
        color: account.color || "#3b82f6",
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: "",
        bankName: "",
        accountNumber: "",
        accountType: "checking",
        balance: 0,
        currency: "USD",
        color: "#3b82f6",
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
      if (editingAccount) {
        await updateMutation.mutateAsync({
          id: editingAccount.id,
          ...formData,
        });
        toast.success("Cuenta actualizada correctamente");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Cuenta creada correctamente");
      }
      setIsDialogOpen(false);
      refetch();
      utils.transactions.summary.invalidate();
    } catch (error) {
      toast.error("Error al guardar la cuenta");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta cuenta?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Cuenta eliminada correctamente");
        refetch();
        utils.transactions.summary.invalidate();
      } catch (error) {
        toast.error("Error al eliminar la cuenta");
      }
    }
  };

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cuentas Bancarias</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus cuentas bancarias y balances</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cuenta
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Balance Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">
            ${totalBalance.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {accounts?.length || 0} cuenta{accounts?.length !== 1 ? "s" : ""} activa{accounts?.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => (
          <Card key={account.id} className="border-l-4" style={{ borderLeftColor: account.color || "#3b82f6" }}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: account.color || "#3b82f6" }}
                  >
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription>{account.bankName}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${Number(account.balance).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {account.accountType === "checking" ? "Corriente" : account.accountType === "savings" ? "Ahorro" : "Inversión"}
                  </span>
                </div>
                {account.accountNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-mono">****{account.accountNumber.slice(-4)}</span>
                  </div>
                )}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(account)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tienes cuentas registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza agregando tu primera cuenta bancaria</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Cuenta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Actualiza la información de tu cuenta" : "Agrega una nueva cuenta bancaria"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Cuenta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Cuenta Principal"
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
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Últimos 4 dígitos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountType">Tipo de Cuenta</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value: "checking" | "savings" | "investment") =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Corriente</SelectItem>
                  <SelectItem value="savings">Ahorro</SelectItem>
                  <SelectItem value="investment">Inversión</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Balance Inicial</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
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
            <Button onClick={handleSubmit}>
              {editingAccount ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
