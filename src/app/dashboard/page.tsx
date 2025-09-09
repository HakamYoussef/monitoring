import { ProtectedRoute } from '@/components/common/protected-route';
import { DashboardSelector } from '@/components/dashboard/dashboard-selector';

function DashboardPage() {
  return (
    <div className="container mx-auto py-10">
        <DashboardSelector />
    </div>
  );
}

export default function () {
    return (
        <ProtectedRoute>
            <DashboardPage />
        </ProtectedRoute>
    )
}
