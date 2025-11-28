import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { mockDayInstanceStore } from '@/api/day-instances';
import { DayInstanceSmartTable } from '@/components/day-instances/smart-table';
import { PageHeader } from '@/components/page-header';

export default function History() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (id: string) => {
    navigate({ to: '/', search: { date: id } });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete the history for ${id}?`)) {
      return;
    }
    try {
      await mockDayInstanceStore.delete(id);
      toast.success(`Day instance ${id} deleted`);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to delete day instance', error);
      toast.error('Failed to delete day instance');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div>
        <PageHeader
          description="Review past practice sessions and completed days"
          title="History"
        />
      </div>
      <div className="min-h-0 flex-1">
        <DayInstanceSmartTable
          key={refreshKey}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}
