import { EvidenceError } from './market.mjs';
function finite(value, name, low, high) { if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) throw new EvidenceError('invalid_scenario', `${name} must be between ${low} and ${high}.`); return value; }
const rounded = value => Math.round((value + Number.EPSILON) * 1e8) / 1e8;
// Prices apply to the exact outcome purchased, including when that outcome is No.
export function probabilityScenario({ contracts, entryPrice, scenarioPrices, entryCostUsd = 0, exitCostUsd = 0 }) {
  finite(contracts, 'contracts', 0.000001, 1000000); finite(entryPrice, 'entryPrice', 0, 1);
  finite(entryCostUsd, 'entryCostUsd', 0, 1000000); finite(exitCostUsd, 'exitCostUsd', 0, 1000000);
  if (!Array.isArray(scenarioPrices) || scenarioPrices.length < 1 || scenarioPrices.length > 12) throw new EvidenceError('invalid_scenario', 'Provide between one and twelve scenario prices.');
  scenarioPrices.forEach(price => finite(price, 'scenarioPrice', 0, 1));
  const initialCost = contracts * entryPrice + entryCostUsd, breakEven = entryPrice + (entryCostUsd + exitCostUsd) / contracts;
  return {
    status: 'calculated', evidenceType: 'user_defined_hypothetical', units: { price: 'USD per contract', probability: '0 to 1', money: 'USD' },
    inputs: { contracts, entryPrice, scenarioPrices, entryCostUsd, exitCostUsd }, initialCostUsd: rounded(initialCost),
    breakEvenPrice: rounded(breakEven), breakEvenWithinPriceRange: breakEven <= 1,
    scenarios: scenarioPrices.map(price => { const proceeds = contracts * price - exitCostUsd, pnl = proceeds - initialCost; return { price, probabilityChangePoints: rounded((price - entryPrice) * 100), netProceedsUsd: rounded(proceeds), profitLossUsd: rounded(pnl), returnOnInitialCostPct: initialCost > 0 ? rounded(pnl / initialCost * 100) : null }; }),
    assumptions: ['A fixed number of already purchased outcome contracts is valued at each user-selected price.', 'No order is submitted and no paper position is created.', 'Costs are user-supplied dollar assumptions, not a current venue fee quote.', 'Each row assumes sale at the scenario price; settlement costs may differ.', 'No depth, slippage, market coupling, causal propagation, funding or execution probability is modelled.'],
    formula: 'profitLossUsd = contracts * (scenarioPrice - entryPrice) - entryCostUsd - exitCostUsd'
  };
}
