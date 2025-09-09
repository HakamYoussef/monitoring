
import { getConfigurationNames } from '@/actions/config';
import { CreateUserForm } from '@/components/config/users/create-user-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/common/protected-route';

async function NewUserPage() {
  const availableDashboards = await getConfigurationNames();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>
            Create a new account and assign dashboard access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm availableDashboards={availableDashboards} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function () {
    return (
        <ProtectedRoute>
            <NewUserPage />
        </ProtectedRoute>
    )
}
