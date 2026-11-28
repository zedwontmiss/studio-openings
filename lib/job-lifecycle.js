import {planOf} from './paid-plans.js';

export const DAY = 86400000;
export const EMPLOYER_ROWS = 'SELECT s.id,s.status,s.submission_type,s.job_data,s.created_at,s.reviewed_at,o.tier AS order_tier,o.status AS order_status,o.published_at AS order_published_at FROM job_submissions s LEFT JOIN job_orders o ON o.submission_id=s.id';

export function timestamp(value) {
  if (typeof value !== 'string') return NaN;
  const parts = /^(\d{4}-\d\d-\d\d)(?:[T ](\d\d:\d\d:\d\d(?:\.\d{1,3})?)(Z|[+-]\d\d:\d\d)?)?$/.exec(value);
  if (!parts) return NaN;
  const midnight = Date.parse(parts[1] + 'T00:00:00Z');
  if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0,10) !== parts[1]) return NaN;
  return Date.parse(parts[1] + 'T' + (parts[2] || '00:00:00') + (parts[3] || 'Z'));
}

// Exclusive upper bound shared by the feed, native application, SEO and queue.
export function activeUntil(row, data, now = Date.now()) {
  if (!data || row.status !== 'approved') return NaN;
  const reviewed = timestamp(row.reviewed_at);
  if (!Number.isFinite(reviewed) || reviewed > now) return NaN;
  let end = reviewed + 30 * DAY;
  // Paid placements start at publication. Follow-up reviews do not reset the purchased term.
  if (row.submission_type === 'employer') {
    const plan = planOf(row.order_tier);
    const published = timestamp(row.order_published_at);
    if (row.order_status !== 'paid' || !plan || !Number.isFinite(published) || published > now) return NaN;
    end = published + plan.days * DAY;
  }
  if (data.closesOn) {
    if (!/^\d{4}-\d\d-\d\d$/.test(data.closesOn)) return NaN;
    end = Math.min(end, timestamp(data.closesOn) + DAY);
  }
  return end > now ? end : NaN;
}
