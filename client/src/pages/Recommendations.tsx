import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingDown, AlertTriangle, Target, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "spending" | "savings" | "debt" | "investment";
  potentialSavings?: number;
  priority: number;
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: transactions } = trpc.transactions.list.useQuery();
  const { data: creditCards } = trpc.creditCards.list.useQuery();
  const { data: accounts } = trpc.accounts.list.useQuery();

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Análisis básico de gastos
      const expenseTransactions = transactions?.filter((t: any) => t.type === "expense") || [];
      const incomeTransactions = transactions?.filter((t: any) => t.type === "income") || [];

      const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

      const totalDebt = creditCards?.reduce((sum: number, c: any) => sum + Number(c.currentBalance), 0) || 0;
      const totalBalance = accounts?.reduce((sum: number, a: any) => sum + Number(a.balance), 0) || 0;

      const newRecommendations: Recommendation[] = [];

      // Recomendación 1: Ratio de gastos
      if (totalExpenses > totalIncome * 0.8) {
        newRecommendations.push({
          id: "1",
          title: "Reduce tus gastos mensuales",
          description: `Tus gastos (${((totalExpenses / totalIncome) * 100).toFixed(1)}% de ingresos) están muy cerca de tus ingresos. Intenta reducir gastos discrecionales como suscripciones o entretenimiento.`,
          impact: "high",
          category: "spending",
          potentialSavings: totalExpenses * 0.1,
          priority: 1,
        });
      }

      // Recomendación 2: Deuda de tarjetas de crédito
      if (totalDebt > totalIncome * 0.5) {
        newRecommendations.push({
          id: "2",
          title: "Prioriza pagar tu deuda de tarjetas",
          description: `Tu deuda en tarjetas de crédito (${totalDebt.toLocaleString("es-MX", { minimumFractionDigits: 2 })}) es muy alta. Considera hacer pagos adicionales para reducir intereses.`,
          impact: "high",
          category: "debt",
          potentialSavings: totalDebt * 0.15,
          priority: 2,
        });
      }

      // Recomendación 3: Fondo de emergencia
      if (totalBalance < totalIncome * 3) {
        newRecommendations.push({
          id: "3",
          title: "Construye un fondo de emergencia",
          description: `Se recomienda tener 3-6 meses de gastos ahorrados. Actualmente tienes ${(totalBalance / totalExpenses).toFixed(1)} meses de gastos cubiertos.`,
          impact: "medium",
          category: "savings",
          priority: 3,
        });
      }

      // Recomendación 4: Categorización de gastos
      if (!expenseTransactions.some((t: any) => t.categoryId)) {
        newRecommendations.push({
          id: "4",
          title: "Categoriza tus transacciones",
          description: "Muchas de tus transacciones no están categorizadas. Esto te ayudará a entender mejor dónde va tu dinero.",
          impact: "medium",
          category: "spending",
          priority: 4,
        });
      }

      // Recomendación 5: Análisis de gastos recurrentes
      const recurringExpenses = expenseTransactions.filter((t: any) => t.isRecurring);
      if (recurringExpenses.length > 0) {
        const recurringTotal = recurringExpenses.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
        newRecommendations.push({
          id: "5",
          title: "Revisa tus gastos recurrentes",
          description: `Tienes ${recurringExpenses.length} gastos recurrentes por ${recurringTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}. Considera cancelar servicios que no uses.`,
          impact: "medium",
          category: "spending",
          potentialSavings: recurringTotal * 0.2,
          priority: 5,
        });
      }

      setRecommendations(newRecommendations.sort((a, b) => a.priority - b.priority));
      toast.success("Recomendaciones generadas correctamente");
    } catch (error) {
      toast.error("Error al generar recomendaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions && creditCards && accounts) {
      generateRecommendations();
    }
  }, [transactions, creditCards, accounts]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "spending":
        return <TrendingDown className="w-5 h-5" />;
      case "debt":
        return <AlertTriangle className="w-5 h-5" />;
      case "savings":
        return <Target className="w-5 h-5" />;
      case "investment":
        return <Zap className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recomendaciones Financieras</h1>
          <p className="text-muted-foreground mt-1">Sugerencias personalizadas para mejorar tus finanzas</p>
        </div>
        <Button onClick={generateRecommendations} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analizando..." : "Regenerar"}
        </Button>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="border-l-4" style={{
              borderLeftColor: rec.impact === "high" ? "#ef4444" : rec.impact === "medium" ? "#f59e0b" : "#10b981"
            }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">{getIcon(rec.category)}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <CardDescription className="mt-2">{rec.description}</CardDescription>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getImpactColor(rec.impact)}`}>
                    {rec.impact === "high" ? "Alto" : rec.impact === "medium" ? "Medio" : "Bajo"}
                  </div>
                </div>
              </CardHeader>
              {rec.potentialSavings && (
                <CardContent>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Ahorro potencial:</strong> ${rec.potentialSavings.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay recomendaciones disponibles</h3>
            <p className="text-muted-foreground mb-4">Agrega más transacciones para recibir recomendaciones personalizadas</p>
            <Button onClick={generateRecommendations} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Generar Recomendaciones
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Consejos Financieros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Presupuesto 50/30/20:</strong> Destina el 50% a necesidades, 30% a deseos y 20% a ahorros e inversiones.
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-900 dark:text-purple-100">
                <strong>Deuda de tarjetas:</strong> Intenta pagar el saldo completo cada mes para evitar intereses.
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-900 dark:text-indigo-100">
                <strong>Fondo de emergencia:</strong> Mantén 3-6 meses de gastos en una cuenta de ahorros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
