import { redirect } from 'next/navigation';

export default async function HomePage() {
    // The root page now redirects to the dashboard selection.
    // The protected route wrapper will handle authentication.
    redirect('/dashboard');
}
