import { redirect } from 'next/navigation';
import { getSession } from '@/actions/session';

export default async function HomePage() {
    const session = await getSession();
    if (session.isLoggedIn && session.dashboardNames.length > 0) {
        redirect(`/dashboard/${encodeURIComponent(session.dashboardNames[0])}`);
    }
    // For users without a session or DB, redirect to the main dashboard selector
    redirect('/dashboard');
}
