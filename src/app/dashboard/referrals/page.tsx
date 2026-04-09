import { redirect } from 'next/navigation';

export default function DashboardReferralsRedirect() {
  redirect('/dashboard?panel=referrals');
}
