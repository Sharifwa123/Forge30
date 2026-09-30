import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
export const metadata: Metadata = { title: 'Privacy notice', alternates: { canonical: '/privacy' } };

export default function Privacy() {
  return (
    <>
      <Header open />
      <main id="main" className="paper" style={{ padding: '56px 0 80px' }}>
        <div className="wrap prose" style={{ maxWidth: 780 }}>
          <h1>Privacy notice</h1>
          <p className="lead">How SHARIF TECHNOLOGIES handles information you give when applying to FORGE30.</p>
          <h2>What we collect</h2>
          <p>Only what is needed to evaluate applications, organise the cohort, plan delivery, communicate with you and administer the program: your name, phone number, email address, general location, age bracket, technical experience, your answers about commitment, availability and equipment, your delivery and contribution preferences, your project idea, and your certificate preference.</p>
          <p>We do not ask for national ID numbers, financial account details, passwords, or other sensitive personal information.</p>
          <h2>Photo, contact details and student card</h2>
          <p>If your place is confirmed, you may upload a passport-style photo for your student card. We ask for it only at that point. Photos are re-encoded to remove hidden metadata, stored privately, and visible only to administrators and on your own card. On your dashboard you can also give extra contact details and an optional emergency contact. A public verification page, reached by scanning the QR code on a card, shows only the holder’s name, student ID and whether the card is active.</p>
          <h2>How we use it</h2>
          <p>To review applications, decide the cohort and delivery arrangement, contact applicants, and improve future cohorts. Your stated contribution range is used for logistical planning only and is not used to rank applicants.</p>
          <h2>Who can see it</h2>
          <p>Only authorised SHARIF TECHNOLOGIES administrators. We do not publish applicant information and we do not sell it. Our hosting and database providers process data on our behalf.</p>
          <h2>Analytics</h2>
          <p>We count anonymous events such as page views and application steps completed. These contain no personal information.</p>
          <h2>Your choices</h2>
          <p>You can ask us to correct or delete your application. The exact retention period is to be determined by SHARIF TECHNOLOGIES. Applicants under 18 should have a parent or guardian’s knowledge of their application.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
