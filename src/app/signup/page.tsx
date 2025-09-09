import { SignupForm } from '@/components/auth/signup-form';
import { getConfigurationNames } from '@/actions/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SignupPage() {
  const availableDashboards = await getConfigurationNames();

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Sign up to get access to your monitoring dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm availableDashboards={availableDashboards} />
        </CardContent>
      </Card>
    </div>
  );
}
