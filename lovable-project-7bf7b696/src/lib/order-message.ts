// -----------------------------------------------------------------------------
// WhatsApp order message — pure, deterministic, unit-testable.
// The checkout route feeds it the resolved delivery area; `areaLabel` is the
// customer-facing exact block (e.g. "Gulshan Block 15"), never the grouped
// range used internally for zone matching. The delivery zone is deliberately
// NOT included anywhere in the customer-facing message.
// -----------------------------------------------------------------------------

export function formatPKR(n: number): string {
  return "Rs. " + n.toLocaleString("en-PK");
}

export type OrderMessageParams = {
  customer: string;
  phone: string;
  /** Customer-facing area — the exact block they typed/resolved. */
  areaLabel: string;
  address: string;
  notes?: string;
  /** Pre-formatted item lines (newline separated). */
  items: string;
  subtotal: number;
  delivery: number;
  grand: number;
  paymentLabel: string;
  /** Extra line appended after the payment method (e.g. payment screenshot note). */
  paymentNote?: string;
};

export function buildOrderMessage(p: OrderMessageParams): string {
  const note = p.notes ? `*Notes:* ${p.notes}\n` : "";
  const payNote = p.paymentNote ?? "";
  return (
    "*Al-Arab Shawarma — New Order*\n\n" +
    `*Customer:* ${p.customer}\n` +
    `*Phone:* ${p.phone}\n` +
    `*Area:* ${p.areaLabel}\n` +
    `*Address:* ${p.address}\n` +
    note +
    `*Items:*\n${p.items}\n\n` +
    `*Subtotal:* ${formatPKR(p.subtotal)}\n` +
    `*Delivery:* ${formatPKR(p.delivery)}\n` +
    `*Grand Total:* ${formatPKR(p.grand)}\n\n` +
    `*Payment Method:* ${p.paymentLabel}${payNote}\n\n` +
    "Thank you!"
  );
}
