// src/lib/agent-invalidation.ts

/**
 * Maps agent tool names to the query keys they invalidate.
 * When the agent calls one of these tools, everything listed here becomes stale.
 * Read-only tools (getDashboardSummary, getTransactions, getAccounts) are absent
 * on purpose — they don't mutate anything.
 */
export const TOOL_INVALIDATIONS: Record<string, string[][]> = {
    addTransaction: [
      ["dashboard"],
      ["transactions"],
      ["accounts"], // account balance changes on every transaction
      ["budget"],   // spent/remaining move with expenses
    ],
    createAccount: [
      ["dashboard"], // availableBalance + lastAccount both shift
      ["accounts"],
    ],

    upsertBudget: [
      ["budget"],
      ["dashboard"], // dashboard shows budget name and percentage
    ],
    deleteBudget: [
      ["budget"],
      ["dashboard"],
    ],
    // rememberFact is memory-only, nothing to invalidate on the finance side
  };