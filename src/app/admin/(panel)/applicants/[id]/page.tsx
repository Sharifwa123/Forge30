import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import { label } from '@/lib/schema';
import ApplicantActions from '@/components/admin/ApplicantActions';
import ProjectView from '@/components/admin/ProjectView';

const KV = ({ k, v }: { k: string; v?: string }) => v ? <div className="kv"><dt>{k}</dt><dd>{v}</dd></div> : null;

export default async function Applicant({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [r] = await q<any>('SELECT * FROM applications WHERE id=$1', [id]);
  if (!r) notFound();
  const d = r.data;
  return (
    <>
      <p><Link href="/admin">← All applicants</Link></p>
      <h1 style={{ fontSize: '2rem' }}>{d.about.fullName} <small style={{ color: 'var(--muted)', fontSize: '1rem' }}>{r.ref}</small></h1>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="panel">
          <h3>Application</h3>
          <dl>
            <KV k="Preferred name" v={d.about.preferredName} /><KV k="Phone" v={r.phone} /><KV k="Email" v={r.email} /><KV k="Location" v={r.location} />
            <KV k="Age" v={label('ageBracket', d.about.ageBracket)} /><KV k="Experience" v={label('experience', d.about.experience)} />
            <KV k="Why become a developer" v={d.commitment.why} /><KV k="Hope to build" v={d.commitment.hopeToBuild} />
            <KV k="Seriousness" v={label('seriousness', d.commitment.seriousness)} /><KV k="Practise outside sessions" v={d.commitment.practise} />
            <KV k="Availability" v={d.availability.periods.join(', ') + (d.availability.periodOther ? ` (${d.availability.periodOther})` : '')} />
            <KV k="Format preference" v={label('format', d.availability.format)} /><KV k="Contribution preference" v={label('contribPref', d.availability.contribPref)} /><KV k="Contribution range" v={label('contribRange', d.availability.contribRange)} />
            <KV k="Phone device" v={label('phone', d.device.phone)} /><KV k="Computer" v={label('computer', d.device.computer)} /><KV k="Shared computer" v={label('sharedComputer', d.device.sharedComputer)} /><KV k="Device note" v={d.device.deviceNote} />
            <KV k="Internet" v={label('internet', d.device.internet)} /><KV k="Electricity" v={label('electricity', d.device.electricity)} /><KV k="Workspace" v={label('workspace', d.device.workspace)} />
            <KV k="Certificate" v={label('certificate', d.finish.certificate)} /><KV k="GH₵500 budget" v={label('budget', d.finish.budget ?? d.project?.budget)} />
            <KV k="WhatsApp" v={r.contact?.whatsapp} /><KV k="Alt phone" v={r.contact?.altPhone} /><KV k="Preferred contact" v={r.contact?.preferredMethod} /><KV k="Best time to reach" v={r.contact?.bestTime} /><KV k="Emergency contact" v={r.contact?.emergencyName ? `${r.contact.emergencyName} · ${r.contact.emergencyPhone}` : undefined} />
          </dl>
        </div>
        <div className="grid">
          <ApplicantActions id={Number(r.id)} status={r.status} notes={r.admin_notes} cohortNote={r.cohort_note} seat={r.seat} group={r.group_label} session={r.session_time} studentId={r.student_id} serial={r.serial} hasPhoto={!!r.photo_at} />
          <ProjectView project={r.project ?? {}} legacy={d.project} id={Number(r.id)} />
        
        </div>
      </div>
      <p style={{ color: 'var(--muted)' }}>Submitted {new Date(r.created_at).toLocaleString('en-GB')} · Last updated {new Date(r.updated_at).toLocaleString('en-GB')}</p>
    </>
  );
}
