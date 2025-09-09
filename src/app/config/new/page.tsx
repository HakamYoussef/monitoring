import { ConfigForm } from '@/components/config/config-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewConfigurationPage() {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New Display Configuration</CardTitle>
          <CardDescription>
            Define a new set of parameters to display on a dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm isCreating={true} />
        </CardContent>
      </Card>
    </div>
  );
}
