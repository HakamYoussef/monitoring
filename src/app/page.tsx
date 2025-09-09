import { redirect } from 'next/navigation';
import { getSession } from '@/actions/session';

export default async function HomePage() {
    const session = await getSession();
    if (session.isLoggedIn && session.dashboardName) {
        redirect(`/dashboard/${encodeURIComponent(session.dashboardName)}`);
    }
    // For users without a session or DB, redirect to the main dashboard selector
    redirect('/dashboard');
}
