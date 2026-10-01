import { createHash } from 'node:crypto';
import type { Settings } from './settings';

/**
 * Fingerprint of everything a student's dashboard and card depend on (their record, assigned seat/group/time,
 * photo, status, feedback, cohort info, notices, announcements, organizer details).
 * When it changes, the open dashboard refreshes itself.
 */
export function revOf(r: any, s: Settings): string {
  const payload = JSON.stringify([
    r.name, r.status, r.student_id, r.serial, r.seat, r.group_label, r.session_time, r.student_message, String(r.confirmed_at ?? ''), String(r.photo_at ?? ''),
    (r.project?.feedback ?? []).map((f: any) => f.id),
    s.applicationsOpen, s.notice, s.cohortName, s.cohortDates, s.deliveryArrangement, s.classArrangement,
    s.noticeTitle, s.noticeStyle, s.noticeCtaLabel, s.noticeCtaUrl, s.noticePopup, s.announcements, s.organizer,
  ]);
  return createHash('sha1').update(payload).digest('hex').slice(0, 16);
}
