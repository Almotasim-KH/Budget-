"use strict";

/**
 * Default app state for a brand-new user. This mirrors the frontend's
 * defaultData() in index.html — keep the two in sync if categories change.
 */
function defaultData() {
  return {
    version: 1,
    settings: { theme: "dark", monthlyBudget: 0, categoryBudgets: {} },
    categories: [
      { id: "c_salary", name: "Salary", type: "income", color: "#22c55e" },
      { id: "c_free", name: "Freelance", type: "income", color: "#14b8a6" },
      { id: "c_other_in", name: "Other Income", type: "income", color: "#84cc16" },
      { id: "c_rent", name: "Rent", type: "expense", color: "#ef4444" },
      { id: "c_groc", name: "Groceries", type: "expense", color: "#f97316" },
      { id: "c_trans", name: "Transport", type: "expense", color: "#3b82f6" },
      { id: "c_ent", name: "Entertainment", type: "expense", color: "#a855f7" },
      { id: "c_util", name: "Utilities", type: "expense", color: "#06b6d4" },
      { id: "c_dine", name: "Dining", type: "expense", color: "#ec4899" },
      { id: "c_health", name: "Health", type: "expense", color: "#8b5cf6" },
      { id: "c_shop", name: "Shopping", type: "expense", color: "#f0b429" },
      { id: "c_bills", name: "Bills", type: "expense", color: "#e11d48" }
    ],
    transactions: [],
    bills: [],
    goals: []
  };
}

module.exports = { defaultData };
