import { useNavigate, useParams } from '@tanstack/react-router';
import humanizeDuration from 'humanize-duration';
import { ArrowLeftIcon, PlusIcon, SaveIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  mockDayTemplateStore,
  type DayTemplate,
  type DayTemplateItem,
} from '@/api/day-templates';
import { mockPracticeSessionStore } from '@/api/practice-sessions';
import { ClickableSeamlessEditor } from '@/components/clickable-seamless-editor';
import { PracticeSessionSmartTable } from '@/components/practice-sessions/smart-table';
import {
  type ItemControlProps,
  SortableList,
  generateNewItemId,
} from '@/components/sortable-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { parseDurationToMinutes } from '@/lib/utils';

// --- Components ---

interface DayTemplateItemProps {
  item: DayTemplateItem;
  controlProps: ItemControlProps;
  onUpdate: (id: string, data: Partial<DayTemplateItem>) => void;
  disabled?: boolean;
}

const DayTemplateItemRow = ({
  item,
  controlProps,
  onUpdate,
  disabled,
}: DayTemplateItemProps) => {
  return (
    <div className="group flex items-center gap-3 rounded-md border bg-card p-3 shadow-sm transition-all hover:border-brand-accent/50">
      <button
        {...controlProps.attributes}
        {...controlProps.listeners}
        className={`cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing ${
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

      <div className="flex-1">
        <div className="font-medium">{item.practice_session_display || 'Unknown Session'}</div>
      </div>

      <div className="text-muted-foreground text-sm">
        <ClickableSeamlessEditor
          className="inline-block w-auto min-w-[60px] text-right"
          disabled={disabled}
          onEditComplete={(val) => {
            const minutes = parseDurationToMinutes(val);
            onUpdate(item.id, { recommended_time_minutes: minutes });
          }}
          placeholder="Duration"
          sourceText={humanizeDuration(item.recommended_time_minutes * 60000, {
            round: true,
            largest: 1,
          })}
        />
      </div>

      {!disabled && controlProps.onDelete && (
        <button
          className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
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

interface DayTemplateEditorProps {
  initialData?: DayTemplate;
  mode: 'create' | 'edit';
  onSave?: (data: Omit<DayTemplate, 'id'>) => Promise<void>;
}

export function DayTemplateEditor({
  initialData,
  mode,
  onSave,
}: DayTemplateEditorProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<Omit<DayTemplate, 'id'>>({
    display: '',
    items: [],
    disabled_at: null,
    ...initialData,
  });

  const [isSelectingSessions, setIsSelectingSessions] = useState(false);
  const [selectionIds, setSelectionIds] = useState<string[]>([]);

  // Sync initialData
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const handleFieldUpdate = async (
    field: keyof Omit<DayTemplate, 'id'>,
    value: any
  ) => {
    const newData = { ...data, [field]: value };
    setData(newData);

    if (mode === 'edit' && initialData) {
      // Auto-save
      try {
        await mockDayTemplateStore.update(initialData.id, { [field]: value });
      } catch (error) {
        console.error('Auto-save failed', error);
        toast.error('Failed to save changes');
      }
    }
  };

  const handleItemsReorder = async (items: DayTemplateItem[]) => {
    const reordered = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));
    handleFieldUpdate('items', reordered);
  };

  const handleItemUpdate = (
    itemId: string,
    updates: Partial<DayTemplateItem>
  ) => {
    const newItems = data.items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    handleFieldUpdate('items', newItems);
  };

  const handleRemoveItem = (id: string) => {
    handleFieldUpdate(
      'items',
      data.items.filter((item) => item.id !== id)
    );
  };

  // Selection Logic
  const startSelection = () => {
    setSelectionIds(data.items.map((i) => i.practice_session_template_id));
    setIsSelectingSessions(true);
  };

  const handleSelectionSave = async () => {
    setIsSelectingSessions(false);
    
    // 1. Filter existing items that are still selected
    const keptItems = data.items.filter((item) =>
      selectionIds.includes(item.practice_session_template_id)
    );
    
    // 2. Find newly selected IDs
    const existingIds = new Set(data.items.map((i) => i.practice_session_template_id));
    const addedIds = selectionIds.filter((id) => !existingIds.has(id));
    
    // 3. Create new items for added sessions
    // We need to fetch session details to get defaults
    const newItemsPromises = addedIds.map(async (sessionId) => {
      try {
        const session = await mockPracticeSessionStore.get(sessionId);
        return {
          id: generateNewItemId(),
          practice_session_template_id: session.id,
          practice_session_display: session.display,
          recommended_time_minutes: session.default_recommended_time_minutes,
          sort_order: 0, // will be fixed by re-index
        } as DayTemplateItem;
      } catch (e) {
        console.error(`Failed to load session ${sessionId}`, e);
        return null;
      }
    });
    
    const newItems = (await Promise.all(newItemsPromises)).filter((i): i is DayTemplateItem => i !== null);
    
    // 4. Combine and re-index
    const allItems = [...keptItems, ...newItems].map((item, idx) => ({
      ...item,
      sort_order: idx,
    }));
    
    handleFieldUpdate('items', allItems);
  };

  const handleSaveCreate = async () => {
    if (!onSave) return;
    try {
      await onSave(data);
      toast.success('Day template created');
      navigate({ to: '/templates/days' });
    } catch (error) {
      console.error('Create failed', error);
      toast.error('Failed to create day template');
    }
  };

  // Render Selection View
  if (isSelectingSessions) {
    return (
      <div className="flex h-full flex-col space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="font-semibold text-lg">Select Practice Sessions</h2>
            <p className="text-muted-foreground text-sm">
              Choose sessions to include in this day template
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsSelectingSessions(false)}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button onClick={handleSelectionSave}>
              Confirm Selection ({selectionIds.length})
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <PracticeSessionSmartTable
            mode="local"
            onSelectionChange={setSelectionIds}
            selectedIds={selectionIds}
          />
        </div>
      </div>
    );
  }

  // Render Editor View
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate({ to: '/templates/days' })}
            size="icon"
            variant="ghost"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-bold text-2xl tracking-tight">
              {mode === 'create'
                ? 'New Day Template'
                : data.display || 'Untitled Template'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'create'
                ? 'Create a new daily routine'
                : 'Edit routine details'}
            </p>
          </div>
        </div>
        {mode === 'create' && (
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: '/templates/days' })}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCreate}>
              <SaveIcon className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            <ClickableSeamlessEditor
              className="font-bold text-xl tracking-tight"
              inputClassName="font-bold text-xl"
              onEditComplete={(val) => handleFieldUpdate('display', val)}
              placeholder="Template Display Name"
              sourceText={data.display}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SortableList
            addButtonLabel="Add Practice Session"
            className="space-y-2"
            deleteMode="button"
            items={data.items}
            onAdd={startSelection}
            onRemove={handleRemoveItem}
            onReorder={handleItemsReorder}
            renderItem={(item, controlProps) => (
              <DayTemplateItemRow
                controlProps={controlProps}
                item={item}
                onUpdate={handleItemUpdate}
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

export default function DayTemplateEditorPage() {
  const { templateId } = useParams({ strict: false }) as { templateId?: string };
  const [template, setTemplate] = useState<DayTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(
    !!templateId && templateId !== 'new'
  );

  useEffect(() => {
    if (templateId && templateId !== 'new') {
      setIsLoading(true);
      mockDayTemplateStore
        .get(templateId)
        .then(setTemplate)
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load day template');
        })
        .finally(() => setIsLoading(false));
    }
  }, [templateId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (templateId === 'new') {
    return (
      <DayTemplateEditor
        mode="create"
        onSave={async (data) => {
          await mockDayTemplateStore.create(data);
        }}
      />
    );
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  return <DayTemplateEditor initialData={template} mode="edit" />;
}

