import { colors } from './tokens';
import type { OrderStatus, StopStatus, TicketType } from './types';

type Pill = { label: string; labelSq: string; bg: string; ink: string; dot: string };

export const ORDER_STATUS: Record<OrderStatus, Pill> = {
  confirmed:            { label: 'Confirmed',          labelSq: 'Konfirmuar',        bg: colors.brandTint,   ink: colors.brandDeep,  dot: colors.brand },
  received:             { label: 'In warehouse',       labelSq: 'Në depo',           bg: colors.field,       ink: colors.ink2,       dot: colors.ink3 },
  packed:               { label: 'Packed',             labelSq: 'Paketuar',          bg: colors.field,       ink: colors.ink2,       dot: colors.ink3 },
  assigned:             { label: 'Assigned',           labelSq: 'Caktuar',           bg: colors.infoTint,    ink: colors.infoInk,    dot: colors.info },
  out_for_delivery:     { label: 'Out for delivery',   labelSq: 'Në rrugë',          bg: colors.infoTint,    ink: colors.infoInk,    dot: colors.info },
  delivered:            { label: 'Delivered',          labelSq: 'Dorëzuar',          bg: colors.successTint, ink: colors.successInk, dot: colors.success },
  failed_attempt:       { label: 'Failed attempt',     labelSq: 'Tentim i dështuar', bg: colors.warningTint, ink: colors.warningInk, dot: colors.warning },
  rescheduled:          { label: 'Rescheduled',        labelSq: 'Riplanifikuar',     bg: colors.warningTint, ink: colors.warningInk, dot: colors.warning },
  returning:            { label: 'Returning',          labelSq: 'Po kthehet',        bg: colors.warningTint, ink: colors.warningInk, dot: colors.warning },
  returned_to_hub:      { label: 'Back at hub',        labelSq: 'Në depo (kthim)',   bg: colors.field,       ink: colors.ink2,       dot: colors.ink3 },
  returned_to_merchant: { label: 'Returned',           labelSq: 'Kthyer',            bg: colors.dangerTint,  ink: colors.dangerInk,  dot: colors.danger },
  cancelled:            { label: 'Cancelled',          labelSq: 'Anuluar',           bg: colors.dangerTint,  ink: colors.dangerInk,  dot: colors.danger }
};

export const STOP_STATUS: Record<StopStatus, { label: string; color: string }> = {
  pending:   { label: 'Not loaded', color: colors.ink3 },
  loaded:    { label: 'To deliver', color: colors.brand },
  arrived:   { label: 'Arrived',    color: colors.info },
  delivered: { label: 'Delivered',  color: colors.success },
  failed:    { label: 'Failed',     color: colors.warning },
  skipped:   { label: 'Skipped',    color: colors.ink3 }
};

export const FAILURE_REASONS: { value: import('./types').FailureReason; label: string; labelSq: string }[] = [
  { value: 'no_answer', label: 'Customer not answering', labelSq: 'Klienti nuk përgjigjet' },
  { value: 'wrong_address', label: 'Address not found', labelSq: 'Adresa nuk u gjet' },
  { value: 'refused', label: 'Refused the parcel', labelSq: 'E refuzoi pakon' },
  { value: 'reschedule_requested', label: 'Asked for another day', labelSq: 'Kërkoi ditë tjetër' },
  { value: 'business_closed', label: 'Shop / office closed', labelSq: 'Mbyllur' },
  { value: 'damaged', label: 'Parcel damaged', labelSq: 'Pako e dëmtuar' },
  { value: 'other', label: 'Other', labelSq: 'Tjetër' }
];

export const TICKET_TYPE: Record<TicketType, string> = {
  pod_review: 'POD review', no_answer: 'No answer', wrong_address: 'Wrong address', refused: 'Refused',
  customer_question: 'Customer question', cash_difference: 'Cash difference', missing_parcel: 'Missing parcel', other: 'Other'
};

/** Status groups used by the Orders tabs. */
export const ORDER_TABS: { key: string; label: string; statuses: OrderStatus[] | null }[] = [
  { key: 'all', label: 'All', statuses: null },
  { key: 'new', label: 'New', statuses: ['confirmed'] },
  { key: 'warehouse', label: 'In warehouse', statuses: ['received', 'packed'] },
  { key: 'route', label: 'On route', statuses: ['assigned', 'out_for_delivery'] },
  { key: 'delivered', label: 'Delivered', statuses: ['delivered'] },
  { key: 'problems', label: 'Problems', statuses: ['failed_attempt', 'rescheduled', 'returning', 'returned_to_hub'] },
  { key: 'closed', label: 'Returned / cancelled', statuses: ['returned_to_merchant', 'cancelled'] }
];

export const STAFF_ROLES = ['owner', 'admin', 'dispatcher', 'front_desk', 'warehouse', 'helpdesk', 'finance', 'hr'] as const;
export const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner', admin: 'Operations Admin', dispatcher: 'Dispatcher', front_desk: 'Front desk', warehouse: 'Warehouse',
  helpdesk: 'Helpdesk', finance: 'Finance', hr: 'HR', driver: 'Driver'
};
