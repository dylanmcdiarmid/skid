import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { mockPracticeSessionStore } from '@/api/practice-sessions';
import { PracticeSessionSmartTable } from '@/components/practice-sessions/smart-table';
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

interface PracticeSessionListProps {
  focusedId: string | null;
  onFocusedIdChange: (id: string | null) => void;
}

export function PracticeSessionList({
  focusedId,
  onFocusedIdChange,
}: PracticeSessionListProps) {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    navigate({ to: '/templates/sessions/new' });
  };

  const handleEdit = (id: string) => {
    navigate({
      to: '/templates/sessions/$sessionId',
      params: { sessionId: id },
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
      const result = await mockPracticeSessionStore.delete(deleteId);
      if (result.success) {
        toast.success('Practice session deleted');
        // Force a re-mount of the table to refresh the data since usePaginatedFetcher
        // state might be stale and we don't have direct access to its refresh method here.
        setDeleteCount((prev) => prev + 1);
      } else {
        toast.error('Failed to delete practice session');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const [deleteCount, setDeleteCount] = useState(0);

  return (
    <div className="flex h-full flex-col space-y-4">
      <PracticeSessionSmartTable
        focusedId={focusedId}
        key={deleteCount}
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
              This action cannot be undone. This will permanently delete the
              practice session template.
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
