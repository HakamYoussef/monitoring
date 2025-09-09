import { getConfiguration } from '@/actions/config';
import { ConfigForm } from '@/components/config/config-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/common/protected-route';


type EditConfigurationPageProps = {
  params: {
    name: string;
  };
};

async function EditConfiguration({ params }: EditConfigurationPageProps) {
  const configName = decodeURIComponent(params.name);
  const config = await getConfiguration(configName);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit: {config.name}</CardTitle>
          <CardDescription>
            Modify the parameters to be displayed on your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigForm initialConfig={config} isCreating={false} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditConfigurationPage({ params }: EditConfigurationPageProps) {
    return (
        <ProtectedRoute>
            <EditConfiguration params={params} />
        </ProtectedRoute>
    )
}
