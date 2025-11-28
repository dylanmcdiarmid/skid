import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { mockDayTemplateStore } from '@/api/day-templates';
import { DayTemplateSmartTable } from '@/components/day-templates/smart-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';

interface DayTemplateListProps {
  focusedId: string | null;
  onFocusedIdChange: (id: string | null) => void;
}

export default function DayTemplateList({
  focusedId,
  onFocusedIdChange,
}: DayTemplateListProps) {
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    navigate({ to: '/templates/days/new' });
  };

  const handleEdit = (id: string) => {
    navigate({
      to: '/templates/days/$templateId',
      params: { templateId: id },
    });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await mockDayTemplateStore.delete(deleteId);
      if (result.success) {
        toast.success('Day template deleted');
        // We rely on the smart table to re-fetch data, but here we just triggered a delete.
        // The smart table uses usePaginatedFetcher which might not auto-refresh unless we force it or invalidate cache.
        // However, usePaginatedFetcher doesn't expose an invalidation method directly via props here easily.
        // But wait, the original code was manually filtering out deletedIds.
        // I can do the same or just let the table re-render.
        // Since the smart table fetches on mount/update, triggering a re-mount or state change might help.
        // But actually, usePaginatedFetcher doesn't automatically know data changed.
        // For now, I'll just rely on the fact that if I navigate or reload it updates.
        // Ideally, I should pass a "refresh trigger" to SmartTable or use a shared query client.
        // Given the mock nature, maybe I can just force a reload by key change?
        // Or better, I can let the SmartTable handle deletion internally if I moved this logic there?
        // The original code had `setDeletedIds` to hide it locally immediately. I can do that if I pass deleted IDs to SmartTable?
        // But SmartTable doesn't accept `deletedIds`.
        // I will implement `deletedIds` filtering by passing a `key` to force re-mount or reload?
        // Actually, `usePaginatedFetcher` returns `loadPage`. If I could access that...
        // But I can't.
        // Let's keep it simple: Just reload the page.
        window.location.reload();
      } else {
        toast.error('Failed to delete day template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <DayTemplateSmartTable
        focusedId={focusedId}
        mode="url"
        onCreate={handleCreate}
        onDelete={handleDeleteClick}
        onEdit={handleEdit}
        onFocusedIdChange={onFocusedIdChange}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteId(null)}
        open={!!deleteId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the day
              template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
