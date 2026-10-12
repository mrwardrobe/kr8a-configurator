import { normalizeConfig } from './sideboardEngine.ts';
import type { SideboardConfig } from './sideboardEngine.ts';

/** A signed-off pricing implementation must run on the server before taking payment.
 * This boundary keeps provisional UI values out of commercial orders. */
export type PricingResult =
  | { status: 'unavailable'; currency: 'GBP'; amountPence: null; reason: string }
  | { status: 'quoted'; currency: 'GBP'; amountPence: number; rulesVersion: string };
export type PricingRules = (config: SideboardConfig) => { amountPence: number; rulesVersion: string };

export function priceDesign(config: SideboardConfig, rules?: PricingRules): PricingResult {
  if (!rules) return { status: 'unavailable', currency: 'GBP', amountPence: null, reason: 'Production pricing has not been approved.' };
  const result = rules(normalizeConfig(config));
  if (!Number.isSafeInteger(result.amountPence) || result.amountPence < 0 || !result.rulesVersion) {
    throw new Error('Pricing rules returned an invalid quote.');
  }
  return { status: 'quoted', currency: 'GBP', ...result };
}
