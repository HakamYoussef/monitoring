import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME } from '@/lib/branding';

export default function LoginPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{APP_NAME}</CardTitle>
          <CardDescription>Welcome back. Please log in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
