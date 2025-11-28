import { useState } from 'react';
import { toast } from 'sonner';

import { type Generator, generatorStore } from '@/api/generators';
import { GeneratorForm } from './generators/generator-form';
import { GeneratorList } from './generators/generator-list';

type ViewState = 'list' | 'create' | 'edit';

export default function Generators() {
  const [view, setView] = useState<ViewState>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGenerator, setEditingGenerator] = useState<
    Generator | undefined
  >(undefined);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingId(null);
    setEditingGenerator(undefined);
    setView('create');
  };

  const handleEdit = async (id: string) => {
    try {
      const generator = await generatorStore.get(id);
      setEditingId(id);
      setEditingGenerator(generator);
      setView('edit');
    } catch (error) {
      console.error('Failed to load generator for edit:', error);
      toast.error('Failed to load generator details');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (view === 'create') {
        await generatorStore.create(data);
        toast.success('Generator created successfully');
      } else if (view === 'edit' && editingId) {
        await generatorStore.update(editingId, data);
        toast.success('Generator updated successfully');
      }

      // Return to list view
      setView('list');
      setEditingId(null);
      setEditingGenerator(undefined);
      // Restore focus if editing, or focus the new item if possible (but we don't have the new ID easily here without refetch logic adjustment, so leaving as null or keeping previous focus is fine for now)
      // Ideally, if we just edited, we keep focus on that ID.
      if (editingId) {
        setFocusedId(editingId);
      }
    } catch (error) {
      console.error('Save error:', error);
      throw error; // Let form handle the error
    }
  };

  const handleCancel = () => {
    setView('list');
    setEditingId(null);
    setEditingGenerator(undefined);
    // Restore focus to the item we were editing or the last focused item
    if (editingId) {
      setFocusedId(editingId);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div className="min-h-0 flex-1">
        {view === 'list' ? (
          <GeneratorList
            focusedId={focusedId}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onFocusedIdChange={setFocusedId}
          />
        ) : (
          <GeneratorForm
            generator={editingGenerator}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
