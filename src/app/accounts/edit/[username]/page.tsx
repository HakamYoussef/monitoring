import { getConfigurationNames } from '@/actions/config';
import { getUser } from '@/actions/users';
import { AccountForm } from '@/components/accounts/account-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EditAccountPageProps {
  params: Promise<{ username: string }>;
}

export default async function EditAccountPage({ params }: EditAccountPageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const user = await getUser(decodedUsername);
  const dashboardNames = await getConfigurationNames();

  if (!user) {
    return <div className="container mx-auto py-10">User not found.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit User: {user.username}</CardTitle>
          <CardDescription>Modify user details and dashboard assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm dashboardNames={dashboardNames} initialUser={user} isCreating={false} />
        </CardContent>
      </Card>
    </div>
  );
}
