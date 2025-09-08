import { getConfiguration } from '@/actions/config';
import { ConfigForm } from '@/components/config/config-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ConfigurationPage() {
  // Admin loads the default configuration to edit.
  const config = await getConfiguration();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Display Configuration</CardTitle>
          <CardDescription>
            Manage the name and parameters to be displayed on your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm initialConfig={config} />
        </CardContent>
      </Card>
    </div>
  );
}
