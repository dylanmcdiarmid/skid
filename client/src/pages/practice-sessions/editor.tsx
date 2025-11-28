import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeftIcon, SaveIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  type PracticeSessionLineItem,
  type PracticeSessionTemplate,
  mockPracticeSessionStore,
} from '@/api/practice-sessions';
import { EditableText } from '@/components/editable-text';
import {
  type ItemControlProps,
  SortableList,
  generateNewItemId,
} from '@/components/sortable-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

// --- Components ---

interface SessionLineItemProps {
  item: PracticeSessionLineItem;
  controlProps: ItemControlProps;
  onUpdate: (id: string, data: Partial<PracticeSessionLineItem>) => void;
  disabled?: boolean;
}

const SessionLineItem = ({
  item,
  controlProps,
  onUpdate,
  disabled,
}: SessionLineItemProps) => {
  return (
    <div className="group flex items-start gap-3 rounded-md border bg-card p-3 shadow-sm transition-all hover:border-brand-accent/50">
      <button
        {...controlProps.attributes}
        {...controlProps.listeners}
        className={`mt-1 cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing ${
          disabled ? 'pointer-events-none opacity-50' : ''
        }`}
        ref={controlProps.ref}
        type="button"
      >
        <svg
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      </button>

      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
           <span className="mt-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-12 shrink-0">Title</span>
           <EditableText
            className="font-medium"
            disabled={disabled}
            onChange={(val) => onUpdate(item.id, { title: val })}
            onEditComplete={(val) => onUpdate(item.id, { title: val })}
            placeholder="Title (e.g. Scales)"
            sourceText={item.title || ''}
          />
        </div>
        <div className="flex gap-2">
           <span className="mt-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-12 shrink-0">Display</span>
           <EditableText
            disabled={disabled}
            multiLine
            onChange={(val) => onUpdate(item.id, { display: val })}
            onEditComplete={(val) => onUpdate(item.id, { display: val })}
            placeholder="Display text..."
            sourceText={item.display || ''}
          />
        </div>
      </div>

      {!disabled && controlProps.onDelete && (
        <button
          className="mt-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
          onClick={controlProps.onDelete}
          type="button"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface PracticeSessionEditorProps {
  initialData?: PracticeSessionTemplate;
  mode: 'create' | 'edit';
  onSave?: (data: Omit<PracticeSessionTemplate, 'id'>) => Promise<void>;
  showUniqueName?: boolean;
}

export function PracticeSessionEditor({
  initialData,
  mode,
  onSave,
  showUniqueName = true,
}: PracticeSessionEditorProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<Omit<PracticeSessionTemplate, 'id'>>({
    unique_name: '',
    display: '',
    default_recommended_time_minutes: 30,
    line_items: [],
    ...initialData,
  });

  // Sync initialData if it changes (for loading state)
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const handleFieldUpdate = async (
    field: keyof Omit<PracticeSessionTemplate, 'id'>,
    value: any
  ) => {
    const newData = { ...data, [field]: value };
    setData(newData);

    if (mode === 'edit' && initialData) {
      // Auto-save
      try {
        await mockPracticeSessionStore.update(initialData.id, { [field]: value });
      } catch (error) {
        console.error('Auto-save failed', error);
        toast.error('Failed to save changes');
      }
    }
  };

  const handleLineItemsReorder = async (items: PracticeSessionLineItem[]) => {
    // Update sort_order based on new index
    const reordered = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));
    
    handleFieldUpdate('line_items', reordered);
  };

  const handleLineItemUpdate = (
    itemId: string,
    updates: Partial<PracticeSessionLineItem>
  ) => {
    const newItems = data.line_items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    handleFieldUpdate('line_items', newItems);
  };

  const handleAddLineItem = () => {
    const newItem: PracticeSessionLineItem = {
      id: generateNewItemId(),
      title: '',
      display: '',
      sort_order: data.line_items.length,
    };
    handleFieldUpdate('line_items', [...data.line_items, newItem]);
  };

  const handleRemoveLineItem = (id: string) => {
    handleFieldUpdate(
      'line_items',
      data.line_items.filter((item) => item.id !== id)
    );
  };

  const handleSaveCreate = async () => {
    if (!onSave) return;
    try {
      await onSave(data);
      toast.success('Practice session created');
      navigate({ to: '/templates/sessions' });
    } catch (error) {
      console.error('Create failed', error);
      toast.error('Failed to create practice session');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: '/templates/sessions' })}
            size="icon"
            variant="ghost"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl tracking-tight">
              {mode === 'create' ? 'New Practice Session' : data.display}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create'
                ? 'Create a new template'
                : 'Edit session template details'}
            </p>
          </div>
        </div>
        {mode === 'create' && (
          <div className="flex gap-2">
             <Button
              onClick={() => navigate({ to: '/templates/sessions' })}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCreate}>
              <SaveIcon className="mr-2 h-4 w-4" />
              Save Session
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Display Name
            </label>
            <EditableText
              onEditComplete={(val) => handleFieldUpdate('display', val)}
              placeholder="e.g. Morning Practice"
              sourceText={data.display}
            />
          </div>

          {showUniqueName && (
            <div className="space-y-1">
              <label className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Unique Name (ID)
              </label>
              <EditableText
                className="font-mono text-sm"
                onEditComplete={(val) => handleFieldUpdate('unique_name', val)}
                placeholder="e.g. morning_practice"
                sourceText={data.unique_name}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Default Duration (Minutes)
            </label>
            <EditableText
              onEditComplete={(val) => {
                 const num = parseInt(val, 10);
                 if (!isNaN(num)) handleFieldUpdate('default_recommended_time_minutes', num);
              }}
              placeholder="30"
              sourceText={data.default_recommended_time_minutes.toString()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <SortableList
            addButtonLabel="Add Line Item"
            className="space-y-2"
            deleteMode="button"
            items={data.line_items}
            onAdd={handleAddLineItem}
            onRemove={handleRemoveLineItem}
            onReorder={handleLineItemsReorder}
            renderItem={(item, controlProps) => (
              <SessionLineItem
                controlProps={controlProps}
                item={item}
                onUpdate={handleLineItemUpdate}
              />
            )}
            showAddButton
          />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Page Wrapper ---

export default function PracticeSessionEditorPage() {
  const { sessionId } = useParams({ strict: false }) as { sessionId?: string };
  const [session, setSession] = useState<PracticeSessionTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(!!sessionId && sessionId !== 'new');

  useEffect(() => {
    if (sessionId && sessionId !== 'new') {
      setIsLoading(true);
      mockPracticeSessionStore
        .get(sessionId)
        .then(setSession)
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load session');
        })
        .finally(() => setIsLoading(false));
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (sessionId === 'new') {
    return (
      <PracticeSessionEditor
        mode="create"
        onSave={async (data) => {
          await mockPracticeSessionStore.create(data);
        }}
      />
    );
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return <PracticeSessionEditor initialData={session} mode="edit" />;
}

