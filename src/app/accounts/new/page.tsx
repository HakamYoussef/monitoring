import { getConfigurationNames } from '@/actions/config';
import { AccountForm } from '@/components/accounts/account-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewAccountPage() {
  const dashboardNames = await getConfigurationNames();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New User Account</CardTitle>
          <CardDescription>
            Create a new user and assign them to a dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm dashboardNames={dashboardNames} />
        </CardContent>
      </Card>
    </div>
  );
}
