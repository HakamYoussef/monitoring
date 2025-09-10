import { getConfiguration } from '@/actions/config';
import { ConfigForm } from '@/components/config/config-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type EditConfigurationPageProps = {
  params: Promise<{
    name: string;
  }>;
};

export default async function EditConfigurationPage({ params }: EditConfigurationPageProps) {
  const { name } = await params;
  const configName = decodeURIComponent(name);
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
