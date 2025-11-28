import { useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import humanizeDuration from 'humanize-duration';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  type DayInstance,
  mockDayInstanceStore,
  type PracticeSessionInstance,
  type PracticeSessionInstanceLineItem,
} from '@/api/day-instances';
import type { DayTemplate } from '@/api/day-templates';
import { mockDayTemplateStore } from '@/api/day-templates';
import { ClickableSeamlessEditor } from '@/components/clickable-seamless-editor';
import { DayTemplateSmartTable } from '@/components/day-templates/smart-table';
import { PageHeader } from '@/components/page-header';
import {
  generateNewItemId,
  type ItemControlProps,
  SortableList,
} from '@/components/sortable-list';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Spinner } from '@/components/ui/spinner';
import { parseDurationToMinutes } from '@/lib/utils';

// --- Components ---

interface LineItemRowProps {
  item: PracticeSessionInstanceLineItem;
  controlProps: ItemControlProps;
  onUpdate: (
    id: string,
    data: Partial<PracticeSessionInstanceLineItem>
  ) => void;
  disabled?: boolean;
}

const LineItemRow = ({
  item,
  controlProps,
  onUpdate,
  disabled,
}: LineItemRowProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="group/line-item relative flex items-start gap-2 py-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onContextMenu={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Delete' && !disabled && controlProps.onDelete) {
              controlProps.onDelete();
            }
          }}
          // Stop propagation so right-clicking a line item doesn't trigger the parent session's context menu
          tabIndex={0}
        >
          <button
            {...controlProps.attributes}
            {...controlProps.listeners}
            className={`mt-1 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing ${
              disabled ? 'pointer-events-none opacity-50' : ''
            } ${
              controlProps.isHovered
                ? 'opacity-100'
                : 'opacity-0 transition-opacity group-hover/line-item:opacity-100'
            }`}
            ref={controlProps.ref}
            type="button"
          >
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Drag to reorder</title>
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
            </svg>
          </button>

          <div className="flex-1 space-y-0.5">
            <div className="text-sm">
              <ClickableSeamlessEditor
                className="font-medium"
                disabled={disabled}
                onEditComplete={(val) => onUpdate(item.id, { title: val })}
                placeholder="Title..."
                sourceText={item.title || '(no title)'}
              />
            </div>
            <div className="text-muted-foreground text-xs">
              <ClickableSeamlessEditor
                className="italic"
                disabled={disabled}
                multiLine={true}
                onEditComplete={(val) => onUpdate(item.id, { display: val })}
                placeholder="Description..."
                sourceText={item.display || '(no description)'}
              />
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => controlProps.onDelete?.()}
        >
          Delete {item.title || 'Item'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

interface PracticeSessionItemProps {
  item: PracticeSessionInstance;
  controlProps: ItemControlProps;
  onUpdate: (id: string, data: Partial<PracticeSessionInstance>) => void;
  onLineItemUpdate: (
    sessionId: string,
    lineItemId: string,
    data: Partial<PracticeSessionInstanceLineItem>
  ) => void;
  onLineItemReorder: (
    sessionId: string,
    newLineItems: PracticeSessionInstanceLineItem[]
  ) => void;
  onLineItemDelete: (sessionId: string, lineItemId: string) => void;
  onLineItemAdd: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  disabled?: boolean;
}

const PracticeSessionItemRow = ({
  item,
  controlProps,
  onUpdate,
  onLineItemUpdate,
  onLineItemReorder,
  onLineItemDelete,
  onLineItemAdd,
  onDelete,
  disabled,
}: PracticeSessionItemProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="group flex items-start gap-3 rounded-md border bg-card p-3 shadow-sm transition-all hover:border-brand-accent/50">
          <button
            {...controlProps.attributes}
            {...controlProps.listeners}
            className={`mt-1 cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground active:cursor-grabbing ${
              disabled ? 'pointer-events-none opacity-50' : ''
            } ${controlProps.isHovered ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100'}`}
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
              <title>Drag to reorder</title>
              <path d="M9 17H15" />
              <path d="M9 12H15" />
              <path d="M9 7H15" />
            </svg>
          </button>

          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 font-medium">
                <ClickableSeamlessEditor
                  className="font-medium"
                  disabled={disabled}
                  onEditComplete={(val) => onUpdate(item.id, { display: val })}
                  sourceText={item.display}
                />
              </div>

              <div className="flex flex-col gap-0.5 text-sm">
                <div className="w-[120px]">
                  <ClickableSeamlessEditor
                    className="inline-block w-full"
                    disabled={disabled}
                    inputClassName="w-full"
                    onEditComplete={(val) => {
                      const minutes = parseDurationToMinutes(val);
                      onUpdate(item.id, { actual_time_spent_minutes: minutes });
                    }}
                    placeholder="(no time logged)"
                    sourceText={
                      item.actual_time_spent_minutes > 0
                        ? humanizeDuration(
                            item.actual_time_spent_minutes * 60_000,
                            {
                              round: true,
                              largest: 1,
                            }
                          )
                        : ''
                    }
                  />
                </div>

                <div className="w-[120px] text-muted-foreground text-xs">
                  <ClickableSeamlessEditor
                    className="w-full"
                    disabled={disabled}
                    inputClassName="w-full"
                    onEditComplete={(val) => {
                      const minutes = parseDurationToMinutes(val);
                      onUpdate(item.id, { recommended_time_minutes: minutes });
                    }}
                    placeholder="(rec time)"
                    sourceText={
                      item.recommended_time_minutes &&
                      item.recommended_time_minutes > 0
                        ? humanizeDuration(
                            item.recommended_time_minutes * 60_000,
                            {
                              round: true,
                              largest: 1,
                            }
                          )
                        : ''
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pl-2">
              <SortableList
                addButtonLabel="Add Line Item"
                addButtonVariant="hover-bottom"
                deleteMode="button"
                items={item.line_items}
                onAdd={() => onLineItemAdd(item.id)}
                onRemove={(id) => onLineItemDelete(item.id, id)}
                onReorder={(newItems) => onLineItemReorder(item.id, newItems)}
                renderItem={(lineItem, lineControlProps) => (
                  <LineItemRow
                    controlProps={lineControlProps}
                    disabled={disabled}
                    item={lineItem}
                    onUpdate={(id, data) => onLineItemUpdate(item.id, id, data)}
                  />
                )}
                showAddButton={true}
              />
            </div>

            <div className="pl-2">
              <ClickableSeamlessEditor
                className="text-muted-foreground text-sm italic"
                disabled={disabled}
                multiLine={true}
                onEditComplete={(val) => onUpdate(item.id, { notes: val })}
                placeholder="(notes)"
                sourceText={item.notes || ''}
              />
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => onDelete?.(item.id)}
        >
          Delete {item.display || 'Session'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default function Today() {
  const searchParams = useSearch({ strict: false }) as any;
  const dateParam = searchParams.date;
  // Use local time for "today" default
  const today = format(new Date(), 'yyyy-MM-dd');
  const date = dateParam || today;

  const [instance, setInstance] = useState<DayInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Helper to refresh the instance data
  const loadInstance = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await mockDayInstanceStore.get(date);
      setInstance(data);
    } catch (error) {
      console.error('Error fetching instance:', error);
      toast.error('Failed to check day instance');
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadInstance();
  }, [loadInstance]);

  const handleTemplateSelect = async (template: DayTemplate) => {
    setIsCreating(true);
    try {
      await mockDayInstanceStore.createFromTemplate(date, template.id);
      toast.success('Day instance created');
      await loadInstance();
    } catch (error) {
      console.error('Error creating instance:', error);
      toast.error('Failed to create day instance');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDay = async () => {
    if (!instance) {
      return;
    }

    try {
      await mockDayInstanceStore.delete(date);
      setInstance(null);
      toast.success('Day reset successfully');
    } catch (error) {
      console.error('Error deleting day instance:', error);
      toast.error('Failed to reset day');
    }
  };

  const handleDayUpdate = async (updates: Partial<DayInstance>) => {
    if (!instance) {
      return;
    }
    try {
      await mockDayInstanceStore.update(date, updates);
      setInstance((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      console.error('Error updating day instance:', error);
      toast.error('Failed to update day instance');
    }
  };

  const handleSessionUpdate = async (
    sessionId: string,
    updates: Partial<PracticeSessionInstance>
  ) => {
    if (!instance) {
      return;
    }

    try {
      await mockDayInstanceStore.updateSession(date, sessionId, updates);
      // Update local state immediately for UI responsiveness
      setInstance((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updates } : s
          ),
        };
      });
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    if (!instance) {
      return;
    }

    // Optimistic update
    setInstance((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== sessionId),
      };
    });

    try {
      await mockDayInstanceStore.deleteSession(date, sessionId);
      toast.success('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
      loadInstance(); // Revert
    }
  };

  const handleLineItemUpdate = async (
    sessionId: string,
    lineItemId: string,
    data: Partial<PracticeSessionInstanceLineItem>
  ) => {
    if (!instance) {
      return;
    }
    try {
      await mockDayInstanceStore.updateLineItem(
        date,
        sessionId,
        lineItemId,
        data
      );
      setInstance((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s.id !== sessionId) {
              return s;
            }
            return {
              ...s,
              line_items: s.line_items.map((li) =>
                li.id === lineItemId ? { ...li, ...data } : li
              ),
            };
          }),
        };
      });
    } catch (error) {
      console.error('Error updating line item', error);
      toast.error('Failed to update line item');
    }
  };

  const handleLineItemDelete = async (
    sessionId: string,
    lineItemId: string
  ) => {
    if (!instance) {
      return;
    }
    // Optimistic update
    setInstance((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) {
            return s;
          }
          return {
            ...s,
            line_items: s.line_items.filter((li) => li.id !== lineItemId),
          };
        }),
      };
    });

    try {
      await mockDayInstanceStore.deleteLineItem(date, sessionId, lineItemId);
    } catch (error) {
      console.error('Failed to delete line item', error);
      toast.error('Failed to delete line item');
      loadInstance(); // Revert on error
    }
  };

  const handleLineItemReorder = async (
    sessionId: string,
    newLineItems: PracticeSessionInstanceLineItem[]
  ) => {
    if (!instance) {
      return;
    }

    // Optimistic
    setInstance((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) {
            return s;
          }
          return {
            ...s,
            line_items: newLineItems,
          };
        }),
      };
    });

    try {
      const ids = newLineItems.map((li) => li.id);
      await mockDayInstanceStore.reorderLineItems(date, sessionId, ids);
    } catch (error) {
      console.error('Failed to reorder line items', error);
      toast.error('Failed to reorder line items');
      loadInstance();
    }
  };

  const handleLineItemAdd = async (sessionId: string) => {
    if (!instance) {
      return;
    }

    const tempId = generateNewItemId();
    const newItem: PracticeSessionInstanceLineItem = {
      id: tempId,
      practice_session_instance_id: sessionId,
      source_line_item_id: null,
      title: '',
      display: '',
      sort_order: 9999,
      is_completed: false,
      completed_at: null,
      updated_at: null,
      notes: null,
    };

    // Optimistic update
    setInstance((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s.id !== sessionId) {
            return s;
          }
          return {
            ...s,
            line_items: [...s.line_items, newItem],
          };
        }),
      };
    });

    try {
      const createdItem = await mockDayInstanceStore.createLineItem(
        date,
        sessionId,
        {}
      );

      // Update with real item
      setInstance((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s.id !== sessionId) {
              return s;
            }
            return {
              ...s,
              line_items: s.line_items.map((li) =>
                li.id === tempId ? createdItem : li
              ),
            };
          }),
        };
      });
    } catch (error) {
      console.error('Failed to add line item', error);
      toast.error('Failed to add line item');
      loadInstance(); // Revert on error
    }
  };

  const handleReorder = async (newSessions: PracticeSessionInstance[]) => {
    if (!instance) {
      return;
    }

    // Optimistic update
    const oldSessions = instance.sessions;
    setInstance({ ...instance, sessions: newSessions });

    try {
      const sessionIds = newSessions.map((s) => s.id);
      await mockDayInstanceStore.reorderSessions(date, sessionIds);

      // Sync with Day Template if exists
      if (instance.source_day_template_id) {
        try {
          const template = await mockDayTemplateStore.get(
            instance.source_day_template_id
          );

          // Create a map of current template items
          // We need to reorder template items to match the order of sessions.
          // The linking key is practice_session_template_id.

          // Order of practice_session_template_ids in the new session list
          const desiredOrderIds = newSessions
            .map((s) => s.practice_session_template_id)
            .filter(Boolean) as string[];

          // We need to preserve items that might not be in the session list (if any) or handle duplicates?
          // Assuming 1-to-1 mapping for simplicity based on how createFromTemplate works.

          const newItems = [...template.items].sort((a, b) => {
            const indexA = desiredOrderIds.indexOf(
              a.practice_session_template_id
            );
            const indexB = desiredOrderIds.indexOf(
              b.practice_session_template_id
            );

            // If both exist in the new order, sort by that
            if (indexA !== -1 && indexB !== -1) {
              return indexA - indexB;
            }
            // If one exists, it goes first? Or keep original relative order?
            // Let's assume they all exist. If not, put at end.
            if (indexA !== -1) {
              return -1;
            }
            if (indexB !== -1) {
              return 1;
            }
            return 0;
          });

          // Update sort_order property
          const updatedItems = newItems.map((item, idx) => ({
            ...item,
            sort_order: idx,
          }));

          // We need to update the template with new items list
          // Note: mockDayTemplateStore.update expects Partial<Omit<DayTemplate, ...>>
          // and "items" is part of that.
          await mockDayTemplateStore.update(template.id, {
            items: updatedItems,
          });
        } catch (tmplError) {
          console.error('Failed to sync with day template:', tmplError);
          toast.warning('Session reordered, but template sync failed');
        }
      }
    } catch (error) {
      console.error('Error reordering sessions:', error);
      toast.error('Failed to reorder sessions');
      // Revert
      setInstance({ ...instance, sessions: oldSessions });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (instance) {
    return (
      <div className="flex h-full flex-col space-y-6">
        <div>
          <PageHeader
            description="View and track your practice sessions."
            title={`Day Instance: ${date}`}
          />
          <div className="mt-4 px-1">
            <ClickableSeamlessEditor
              className="text-muted-foreground italic"
              multiLine={true}
              onEditComplete={(val) => handleDayUpdate({ notes: val })}
              placeholder="(notes)"
              sourceText={instance.notes || ''}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Sessions</h3>
          </div>

          <SortableList
            items={instance.sessions}
            onReorder={handleReorder}
            renderItem={(item, controlProps) => (
              <PracticeSessionItemRow
                controlProps={controlProps}
                disabled={isCreating} // Reuse loading state or similar if appropriate
                item={item}
                onDelete={handleSessionDelete}
                onLineItemAdd={handleLineItemAdd}
                onLineItemDelete={handleLineItemDelete}
                onLineItemReorder={handleLineItemReorder}
                onLineItemUpdate={handleLineItemUpdate}
                onUpdate={handleSessionUpdate}
              />
            )}
          />

          {instance.sessions.length === 0 && (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              No sessions for this day.
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center pb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="text-muted-foreground hover:text-destructive"
                size="sm"
                variant="ghost"
              >
                Reset Day
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  day instance and all associated session data for {date}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteDay}
                >
                  Reset Day
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        description="Select a template to generate your practice session for this day."
        title={`Create Day: ${date}`}
      />
      <div className="min-h-0 flex-1">
        {isCreating ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Spinner className="mx-auto mb-4 h-8 w-8" />
              <p>Creating day instance...</p>
            </div>
          </div>
        ) : (
          <DayTemplateSmartTable mode="local" onSelect={handleTemplateSelect} />
        )}
      </div>
    </div>
  );
}
