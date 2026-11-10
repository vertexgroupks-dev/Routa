export type AppRole = 'owner' | 'admin' | 'dispatcher' | 'front_desk' | 'warehouse' | 'helpdesk' | 'finance' | 'hr' | 'driver';
export type OrderStatus =
  | 'confirmed' | 'received' | 'packed' | 'assigned' | 'out_for_delivery' | 'delivered'
  | 'failed_attempt' | 'rescheduled' | 'returning' | 'returned_to_hub' | 'returned_to_merchant' | 'cancelled';
export type CodStatus = 'none' | 'pending' | 'collected' | 'handed_in' | 'settled' | 'paid_out';
export type StopStatus = 'pending' | 'loaded' | 'arrived' | 'delivered' | 'failed' | 'skipped';
export type RouteStatus = 'draft' | 'published' | 'loading' | 'in_progress' | 'completed' | 'cancelled';
export type FailureReason = 'no_answer' | 'wrong_address' | 'refused' | 'reschedule_requested' | 'business_closed' | 'damaged' | 'other';
export type TicketType = 'pod_review' | 'no_answer' | 'wrong_address' | 'refused' | 'customer_question' | 'cash_difference' | 'missing_parcel' | 'other';
export type TicketStatus = 'open' | 'pending' | 'resolved';

export interface Order {
  id: string; org_id: string; merchant_id: string | null; code: string; tracking_code: string; merchant_ref: string | null;
  source: string; status: OrderStatus; customer_name: string; customer_phone: string; address_line: string | null;
  address_details: Record<string, unknown> | null; city: string | null; landmark: string | null; needs_pin: boolean;
  zone_id: string | null; delivery_date: string | null; window_start: string | null; window_end: string | null;
  weight_kg: number | null; parcels: number | null; notes_driver: string | null; attempts: number; cod_amount: number;
  cod_status: CodStatus; delivery_fee: number | null; weight_fee: number | null; cod_fee: number | null;
  delivered_at: string | null; created_at: string;
}

export interface TrackResult {
  found: boolean; code?: string; status?: OrderStatus; eta?: string | null; address?: string | null;
  driver?: { name?: string; phone?: string } | null; merchant?: string | null; company?: string | null;
  events?: { at: string; status: OrderStatus }[];
  [key: string]: unknown;
}
