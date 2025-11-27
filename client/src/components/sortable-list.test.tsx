import QUnit from 'qunit';
import { render } from '@tests/test-utils';
import { SortableList, sortableListDataAtom, generateNewItemId } from './sortable-list';
import { getAtomValue } from '@tests/test-utils';
import { createStore } from 'jotai';
import { fireEvent } from '@testing-library/react';

const { module, test } = QUnit;

module('Component | SortableList', () => {
  const items = [
    { id: '1', text: 'Item 1' },
    { id: '2', text: 'Item 2' },
    { id: '3', text: 'Item 3' },
  ];

  const renderItem = (item: { id: string; text: string }, dragHandleProps: any) => (
    <div className="item-content">
      <button 
        {...dragHandleProps.attributes} 
        {...dragHandleProps.listeners} 
        ref={dragHandleProps.ref}
        aria-label="Drag Handle"
      >
        ::
      </button>
      <span>{item.text}</span>
      {dragHandleProps.onDelete && (
        <button aria-label="Delete" onClick={dragHandleProps.onDelete}>
          X
        </button>
      )}
    </div>
  );

  test('renders all items', async (assert) => {
    const { findByText } = render(
      <SortableList items={items} renderItem={renderItem} />
    );
    
    assert.dom(await findByText('Item 1')).exists();
    assert.dom(await findByText('Item 2')).exists();
    assert.dom(await findByText('Item 3')).exists();
  });

  test('renders drag handles', async (assert) => {
    const { findAllByLabelText } = render(
      <SortableList items={items} renderItem={renderItem} />
    );

    const handles = await findAllByLabelText('Drag Handle');
    assert.equal(handles.length, 3, 'Three drag handles found');
  });

  test('items have unique id attributes', async (assert) => {
    const { container } = render(
      <SortableList items={items} renderItem={renderItem} />
    );

    const itemElements = container.querySelectorAll('[data-item-id]');
    assert.equal(itemElements.length, 3, 'Three item wrappers found');
    assert.equal(itemElements[0].getAttribute('data-item-id'), '1');
    assert.equal(itemElements[1].getAttribute('data-item-id'), '2');
    assert.equal(itemElements[2].getAttribute('data-item-id'), '3');
  });

  test('uses custom wrapper component', async (assert) => {
    const CustomWrapper = ({ children, ...props }: any) => (
      <article {...props} className="custom-wrapper">
        {children}
      </article>
    );

    const { container } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem} 
        WrapperComponent={CustomWrapper}
      />
    );

    const wrappers = container.querySelectorAll('article.custom-wrapper');
    assert.equal(wrappers.length, 3, 'Used custom wrapper component');
  });

  test('syncs initial items to atom', async (assert) => {
    const store = createStore();
    render(
      <SortableList items={items} renderItem={renderItem} />,
      { store }
    );

    const atomValue = getAtomValue(store, sortableListDataAtom);
    assert.equal(atomValue.length, 3, 'Atom has 3 items');
    assert.deepEqual(atomValue[0], { id: '1', sortOrder: 0 });
    assert.deepEqual(atomValue[1], { id: '2', sortOrder: 1 });
    assert.deepEqual(atomValue[2], { id: '3', sortOrder: 2 });
  });

  // Note: Simulating drag and drop in JSDOM with dnd-kit is complex and brittle.
  // We rely on dnd-kit's internal tests for the drag logic, and here we verify
  // that the component is wired up correctly (drag handles have attributes).
  
  test('drag handles have dnd-kit listeners', async (assert) => {
     const { findAllByLabelText } = render(
      <SortableList items={items} renderItem={renderItem} />
    );

    const handles = await findAllByLabelText('Drag Handle');
    const firstHandle = handles[0];
    
    // Check for aria attributes dnd-kit adds
    assert.dom(firstHandle).hasAttribute('aria-roledescription', 'sortable');
  });

  test('generateNewItemId returns formatted id', (assert) => {
    const id = generateNewItemId();
    assert.ok(id.startsWith('new:'), 'ID starts with new:');
    assert.ok(id.length > 4, 'ID has content after prefix');
  });

  test('renders add button when enabled', async (assert) => {
    const { findByText } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem} 
        showAddButton={true}
        addButtonLabel="New Entry"
      />
    );

    assert.dom(await findByText('New Entry')).exists();
  });

  test('triggers onAdd when add button clicked', async (assert) => {
    let addClicked = false;
    const { findByText } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem} 
        showAddButton={true}
        onAdd={() => { addClicked = true; }}
      />
    );

    const button = await findByText('Add Item'); // Default label
    await fireEvent.click(button);
    
    assert.ok(addClicked, 'onAdd callback fired');
  });

  test('deleteMode="button" provides onDelete to renderItem', async (assert) => {
    let deletedId: string | null = null;
    const { findAllByLabelText } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem}
        deleteMode="button"
        onRemove={(id) => { deletedId = id; }}
      />
    );

    const deleteButtons = await findAllByLabelText('Delete');
    assert.equal(deleteButtons.length, 3, 'Delete buttons rendered');

    await fireEvent.click(deleteButtons[0]);
    assert.equal(deletedId, '1', 'onRemove fired with correct ID');
  });

  test('deleteMode="key" triggers onRemove on key press while hovering', async (assert) => {
    let deletedId: string | null = null;
    const { container } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem}
        deleteMode="key"
        onRemove={(id) => { deletedId = id; }}
      />
    );

    // Find the wrapper for the first item
    const firstItemWrapper = container.querySelector('[data-item-id="1"]');
    if (!firstItemWrapper) throw new Error('Item wrapper not found');

    // Simulate hover
    fireEvent.mouseEnter(firstItemWrapper);

    // Simulate Delete key press
    fireEvent.keyDown(window, { key: 'Delete' });

    assert.equal(deletedId, '1', 'onRemove fired on Delete key');

    // Reset and try Backspace
    deletedId = null;
    fireEvent.keyDown(window, { key: 'Backspace' });
    assert.equal(deletedId, '1', 'onRemove fired on Backspace key');

    // Simulate mouse leave
    fireEvent.mouseLeave(firstItemWrapper);
    deletedId = null;
    
    // Should not fire after mouse leave
    fireEvent.keyDown(window, { key: 'Delete' });
    assert.equal(deletedId, null, 'onRemove not fired when not hovering');
  });

  test('keyboardShortcutsDisabled prevents delete actions', async (assert) => {
    let deleteCalled = false;
    const { container } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem}
        deleteMode="key"
        keyboardShortcutsDisabled={true}
        onRemove={() => { deleteCalled = true; }}
      />
    );

    const firstItemWrapper = container.querySelector('[data-item-id="1"]');
    if (!firstItemWrapper) throw new Error('Item wrapper not found');

    fireEvent.mouseEnter(firstItemWrapper);
    fireEvent.keyDown(window, { key: 'Delete' });

    assert.notOk(deleteCalled, 'onRemove not fired when keyboardShortcutsDisabled is true');
  });

  test('arrow keys reorder items while hovering', async (assert) => {
    let reorderedItems: any[] = [];
    const { container } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem}
        onReorder={(newItems) => { reorderedItems = newItems; }}
      />
    );

    const firstItemWrapper = container.querySelector('[data-item-id="1"]');
    if (!firstItemWrapper) throw new Error('Item wrapper not found');

    // Hover first item
    fireEvent.mouseEnter(firstItemWrapper);

    // Move down
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    
    assert.equal(reorderedItems.length, 3, 'Reorder callback fired');
    assert.equal(reorderedItems[0].id, '2', 'Item 2 moved to first position');
    assert.equal(reorderedItems[1].id, '1', 'Item 1 moved to second position');

    // Reset
    reorderedItems = [];
    
    // Test ArrowUp on the second item
    const secondItemWrapper = container.querySelector('[data-item-id="2"]');
    if (!secondItemWrapper) throw new Error('Item wrapper not found');
    
    // Note: Since we didn't update props, the list order in DOM is still 1, 2, 3
    fireEvent.mouseLeave(firstItemWrapper);
    fireEvent.mouseEnter(secondItemWrapper);
    
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    
    assert.equal(reorderedItems.length, 3, 'Reorder callback fired');
    assert.equal(reorderedItems[0].id, '2', 'Item 2 moved to first position');
    assert.equal(reorderedItems[1].id, '1', 'Item 1 moved to second position');
  });

  test('keyboardShortcutsDisabled prevents reordering', async (assert) => {
    let reorderedCalled = false;
    const { container } = render(
      <SortableList 
        items={items} 
        renderItem={renderItem}
        keyboardShortcutsDisabled={true}
        onReorder={() => { reorderedCalled = true; }}
      />
    );

    const firstItemWrapper = container.querySelector('[data-item-id="1"]');
    if (!firstItemWrapper) throw new Error('Item wrapper not found');

    fireEvent.mouseEnter(firstItemWrapper);
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    assert.notOk(reorderedCalled, 'onReorder not fired when keyboardShortcutsDisabled is true');
  });
});
