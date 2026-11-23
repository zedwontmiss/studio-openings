import {safeJobURL} from './source-registry-core.js';
import {timestamp, DAY} from './job-lifecycle.js';
import {outreachHeld} from './outreach-policy.js';

// Only the operator review table supplies rights, full text and review time.
// Its view pins that decision to the exact snapshot and source identity.
export function sourceSeoJob(row, now = Date.now()) {
  if(row&&outreachHeld(row.employer_name,row.original_url))return null;
  if (!row || row.source_status !== 'approved' || row.snapshot_state !== 'active' || row.miss_count !== 0) return null;
  const seen = timestamp(row.last_seen_at);
  const reviewed = timestamp(row.verified_at);
  const end = Math.min(seen + 3*DAY, reviewed + 7*DAY);
  if (!(seen <= now && reviewed <= now && end > now)) return null;
  let job;
  try { job = JSON.parse(row.job_json); } catch { return null; }
  if (!job || row.id !== job.id || !/^[a-z0-9-]{8,160}$/i.test(job.id)) return null;
  if (!row.board_token || !row.rights_evidence || !row.original_url || safeJobURL(job.url,row) !== row.original_url) return null;
  const description = String(row.full_description || '').trim();
  if (description.length < 240 || description.length > 16000 || !job.title || !row.employer_name || !job.location || !job.role) return null;
  const expires = job.expiresAt ? timestamp(job.expiresAt) : Infinity;
  if (!(expires > now)) return null;
  return {id:job.id, title:job.title, company:row.employer_name, description,
    location:job.location, role:job.role, url:row.original_url, source:row.employer_name,
    verifiedAt:row.verified_at, end:Math.min(end,expires)};
}
