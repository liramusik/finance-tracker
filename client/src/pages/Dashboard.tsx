import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, CreditCard, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableCard } from "@/components/DraggableCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: accounts, isLoading: accountsLoading } = trpc.accounts.list.useQuery();
  const { data: creditCards, isLoading: cardsLoading } = trpc.creditCards.list.useQuery();
  const { data: transactions, isLoading: transactionsLoading } = trpc.transactions.recent.useQuery({ limit: 100 });
  const { data: summary, isLoading: summaryLoading } = trpc.transactions.summary.useQuery();
  const clearDataMutation = trpc.admin.clearAllData.useMutation();

  const [cardOrder, setCardOrder] = useState<string[]>(["balance", "debt", "income", "expenses"]);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const isLoading = accountsLoading || cardsLoading || transactionsLoading || summaryLoading;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleClearData = async () => {
    try {
      await clearDataMutation.mutateAsync();
      toast.success("Todos los datos han sido eliminados correctamente");
      setShowClearDialog(false);
      window.location.reload();
    } catch (error) {
      toast.error("Error al limpiar datos");
    }
  };

  // Calculate totals
  const totalBalance = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((sum: number, acc: any) => sum + Number(acc.balance), 0);
  }, [accounts]);

  const totalDebt = useMemo(() => {
    if (!creditCards) return 0;
    return creditCards.reduce((sum: number, card: any) => sum + Number(card.currentBalance), 0);
  }, [creditCards]);

  const totalIncome = summary?.totalIncome || 0;
  const totalExpenses = summary?.totalExpenses || 0;
  const netBalance = totalIncome - totalExpenses;

  // Prepare chart data
  const categoryData = useMemo(() => {
    if (!summary?.byCategory) return [];
    return summary.byCategory.map((item: any) => ({
      name: item.categoryName || "Sin categoría",
      value: Math.abs(Number(item.total)),
      color: item.categoryColor || "#6b7280",
    }));
  }, [summary]);

  const monthlyData = useMemo(() => {
    if (!summary?.byMonth) return [];
    return summary.byMonth.map((item: any) => ({
      month: item.month,
      ingresos: Number(item.income),
      gastos: Math.abs(Number(item.expenses)),
    }));
  }, [summary]);

  const summaryCards = {
    balance: (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <Wallet className="w-4 h-4 mr-2" />
            Balance Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${totalBalance.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {accounts?.length || 0} cuenta{accounts?.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    ),
    debt: (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Deuda Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${totalDebt.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {creditCards?.length || 0} tarjeta{creditCards?.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    ),
    income: (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ingresos del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Mes actual</p>
        </CardContent>
      </Card>
    ),
    expenses: (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <TrendingDown className="w-4 h-4 mr-2" />
            Gastos del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            ${totalExpenses.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Mes actual</p>
        </CardContent>
      </Card>
    ),
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Financiero</h1>
          <p className="text-muted-foreground mt-1">Resumen general de tus finanzas personales</p>
        </div>
        {user?.role === "admin" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            disabled={clearDataMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar Datos
          </Button>
        )}
      </div>

      {/* Summary Cards with Drag and Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cardOrder.map((cardId) => (
              <div key={cardId}>
                {summaryCards[cardId as keyof typeof summaryCards]}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Net Balance Card */}
      <Card className={`border-2 ${netBalance >= 0 ? "border-green-500" : "border-red-500"}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Balance Neto del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netBalance >= 0 ? "+" : "-"}$
            {Math.abs(netBalance).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {netBalance >= 0 ? "Superávit" : "Déficit"} (Ingresos - Gastos)
          </p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Ingresos vs Gastos (Últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" fill="hsl(var(--chart-2))" name="Ingresos" />
                  <Bar dataKey="gastos" fill="hsl(var(--chart-5))" name="Gastos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de transacciones
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay gastos categorizados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.transactionDate).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div className={`text-lg font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "income" ? "+" : "-"}$
                    {Number(tx.amount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay transacciones registradas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Data Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar todos los datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente todas tus transacciones, cuentas, tarjetas de crédito y categorías personalizadas. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 my-4">
            <p className="text-sm text-destructive font-semibold">⚠️ Advertencia: Esta acción es irreversible</p>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              disabled={clearDataMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {clearDataMutation.isPending ? "Limpiando..." : "Limpiar Datos"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
