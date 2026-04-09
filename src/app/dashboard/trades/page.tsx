import { redirect } from 'next/navigation';

export default function DashboardTradesRedirect() {
  redirect('/dashboard?panel=trades');
}
