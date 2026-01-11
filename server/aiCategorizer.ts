import { invokeLLM } from "./_core/llm";
import { Category } from "../drizzle/schema";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryName?: string;
}

/**
 * Categorize a transaction using AI based on its description
 */
export async function categorizeTransaction(
  description: string,
  amount: number,
  availableCategories: Category[]
): Promise<{ type: "income" | "expense"; categoryId: number | null; categoryName: string }> {
  const categoryList = availableCategories
    .map((c) => `- ${c.name} (${c.type})`)
    .join("\n");

  const prompt = `Eres un asistente financiero experto. Analiza la siguiente transacción y determina:
1. Si es un INGRESO o un GASTO
2. La categoría más apropiada de la lista disponible

Transacción:
- Descripción: ${description}
- Monto: ${amount}

Categorías disponibles:
${categoryList}

Responde SOLO con un objeto JSON en este formato exacto:
{
  "type": "income" o "expense",
  "categoryName": "nombre de la categoría"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un experto en clasificación de transacciones financieras. Responde siempre en formato JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "transaction_categorization",
          strict: true,
          schema: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["income", "expense"],
                description: "Tipo de transacción",
              },
              categoryName: {
                type: "string",
                description: "Nombre de la categoría",
              },
            },
            required: ["type", "categoryName"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);
    
    // Find matching category
    const category = availableCategories.find(
      (c) => c.name.toLowerCase() === result.categoryName.toLowerCase() && c.type === result.type
    );

    return {
      type: result.type,
      categoryId: category?.id ?? null,
      categoryName: result.categoryName,
    };
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    // Default fallback
    return {
      type: amount >= 0 ? "income" : "expense",
      categoryId: null,
      categoryName: "Sin categoría",
    };
  }
}

/**
 * Parse bank statement text and extract transactions using AI
 */
export async function parseStatementText(
  extractedText: string,
  accountType: "bank" | "credit_card"
): Promise<ParsedTransaction[]> {
  const prompt = `Eres un experto en análisis de estados de cuenta bancarios. Extrae TODAS las transacciones del siguiente texto de estado de cuenta.

Tipo de cuenta: ${accountType === "bank" ? "Cuenta bancaria" : "Tarjeta de crédito"}

IMPORTANTE:
- Para cuentas bancarias: los DEPÓSITOS/ABONOS son INGRESOS (positivos), los RETIROS/CARGOS son GASTOS (negativos)
- Para tarjetas de crédito: TODOS los cargos son GASTOS (negativos), los PAGOS/ABONOS son INGRESOS (positivos)
- Extrae TODAS las transacciones que encuentres
- Las fechas deben estar en formato YYYY-MM-DD
- Los montos deben ser números positivos (el tipo indica si es ingreso o gasto)

Texto del estado de cuenta:
${extractedText}

Responde con un array JSON de transacciones en este formato:
[
  {
    "date": "2024-01-15",
    "description": "Descripción de la transacción",
    "amount": 150.50,
    "type": "income" o "expense"
  }
]`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un experto en extracción de datos de estados de cuenta bancarios. Responde siempre en formato JSON con arrays de transacciones.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "statement_transactions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: {
                      type: "string",
                      description: "Fecha en formato YYYY-MM-DD",
                    },
                    description: {
                      type: "string",
                      description: "Descripción de la transacción",
                    },
                    amount: {
                      type: "number",
                      description: "Monto de la transacción (siempre positivo)",
                    },
                    type: {
                      type: "string",
                      enum: ["income", "expense"],
                      description: "Tipo de transacción",
                    },
                  },
                  required: ["date", "description", "amount", "type"],
                  additionalProperties: false,
                },
              },
            },
            required: ["transactions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);
    return result.transactions || [];
  } catch (error) {
    console.error("Error parsing statement text:", error);
    return [];
  }
}

/**
 * Initialize default categories for a user
 */
export function getDefaultCategoryData(): Array<{
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  isDefault: boolean;
}> {
  return [
    // Income categories
    { name: "Salario", type: "income", color: "#10b981", icon: "💰", isDefault: true },
    { name: "Freelance", type: "income", color: "#059669", icon: "💼", isDefault: true },
    { name: "Inversiones", type: "income", color: "#34d399", icon: "📈", isDefault: true },
    { name: "Otros ingresos", type: "income", color: "#6ee7b7", icon: "💵", isDefault: true },

    // Expense categories
    { name: "Alimentación", type: "expense", color: "#ef4444", icon: "🍔", isDefault: true },
    { name: "Transporte", type: "expense", color: "#f97316", icon: "🚗", isDefault: true },
    { name: "Vivienda", type: "expense", color: "#f59e0b", icon: "🏠", isDefault: true },
    { name: "Servicios", type: "expense", color: "#eab308", icon: "💡", isDefault: true },
    { name: "Entretenimiento", type: "expense", color: "#84cc16", icon: "🎮", isDefault: true },
    { name: "Salud", type: "expense", color: "#22c55e", icon: "⚕️", isDefault: true },
    { name: "Educación", type: "expense", color: "#06b6d4", icon: "📚", isDefault: true },
    { name: "Compras", type: "expense", color: "#3b82f6", icon: "🛍️", isDefault: true },
    { name: "Restaurantes", type: "expense", color: "#6366f1", icon: "🍽️", isDefault: true },
    { name: "Viajes", type: "expense", color: "#8b5cf6", icon: "✈️", isDefault: true },
    { name: "Seguros", type: "expense", color: "#a855f7", icon: "🛡️", isDefault: true },
    { name: "Otros gastos", type: "expense", color: "#ec4899", icon: "📦", isDefault: true },
  ];
}
