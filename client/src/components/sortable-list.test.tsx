import QUnit from 'qunit';
import { render } from '@tests/test-utils';
import { SortableList, sortableListDataAtom } from './sortable-list';
import { getAtomValue } from '@tests/test-utils';
import { createStore } from 'jotai';

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
});

