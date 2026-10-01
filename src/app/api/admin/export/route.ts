import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/security';
import { audit } from '@/lib/security';
import { listApplications, type Filters } from '@/lib/admin-query';
import { label } from '@/lib/schema';

// Neutralise spreadsheet formula injection (=, +, -, @, tab, CR) and quote everything.
const cell = (v: unknown) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const f: Filters = {};
  for (const k of ['search', 'status', 'location', 'device', 'format', 'period', 'certificate', 'contrib', 'sort'] as const) { const v = sp.get(k); if (v) f[k] = v; }
  const ids = (sp.get('ids') || '').split(',').filter((x) => /^\d+$/.test(x)).map(Number);
  const all = await listApplications(f, 5000);
  const rows = ids.length ? all.filter((r: any) => ids.includes(Number(r.id))) : all;
  const head = ['Reference', 'Status', 'Submitted', 'Full name', 'Preferred name', 'Phone', 'Email', 'Location', 'Age', 'Experience', 'Can commit', 'Practise', 'Seriousness', 'Periods', 'Format pref', 'Contribution pref', 'Contribution range', 'Phone device', 'Computer', 'Shared computer', 'Internet', 'Electricity', 'Workspace', 'Project title', 'Project idea', 'Problem', 'Users', 'Budget GH₵500', 'Certificate', 'Why', 'Hope to build', 'Notes', 'Project sections ready', 'Student ID', 'Serial', 'Seat', 'Group', 'Session time', 'WhatsApp', 'Alt phone', 'Preferred contact', 'Best time', 'Emergency contact', 'Emergency phone'];
  const lines = [head.map(cell).join(',')];
  for (const r of rows) {
    const d = r.data;
    lines.push([r.ref, r.status, new Date(r.created_at).toISOString(), d.about.fullName, d.about.preferredName, r.phone, r.email, r.location, label('ageBracket', d.about.ageBracket), label('experience', d.about.experience), d.commitment.canCommit, d.commitment.practise, label('seriousness', d.commitment.seriousness), d.availability.periods.join('; '), label('format', d.availability.format), label('contribPref', d.availability.contribPref), label('contribRange', d.availability.contribRange), label('phone', d.device.phone), label('computer', d.device.computer), label('sharedComputer', d.device.sharedComputer), label('internet', d.device.internet), label('electricity', d.device.electricity), label('workspace', d.device.workspace), r.project?.title ?? d.project?.title, r.project?.sections?.idea?.text ?? d.project?.idea, r.project?.sections?.problem?.text ?? d.project?.problem, r.project?.sections?.users?.text ?? d.project?.users, label('budget', d.finish?.budget ?? d.project?.budget), label('certificate', d.finish.certificate), d.commitment.why, d.commitment.hopeToBuild, r.admin_notes, Object.values(r.project?.sections ?? {}).filter((x: any) => x.ready).length, r.student_id, r.serial, r.seat, r.group_label, r.session_time, r.contact?.whatsapp, r.contact?.altPhone, r.contact?.preferredMethod, r.contact?.bestTime, r.contact?.emergencyName, r.contact?.emergencyPhone].map(cell).join(','));
  }
  await audit('applications.export', undefined, { count: rows.length, filters: f });
  return new NextResponse('﻿' + lines.join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="forge30-applicants-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
