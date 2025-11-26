import { fireEvent, waitFor } from '@testing-library/react';
import QUnit from 'qunit';
import { render } from '@tests/test-utils';
import { EditableText } from './editable-text';

const { module, test } = QUnit;

module('Component | EditableText', () => {
  test('renders display text when not editing', async (assert) => {
    const { findByText } = render(
      <EditableText sourceText="Hello World" />
    );

    assert.dom(await findByText('Hello World')).exists();
  });

  test('shows placeholder when sourceText is empty', async (assert) => {
    const { findByText } = render(
      <EditableText sourceText="" placeholder="Enter text..." />
    );

    assert.dom(await findByText('Enter text...')).exists();
  });

  test('enters edit mode on click', async (assert) => {
    const { container, findByRole } = render(
      <EditableText sourceText="Click me" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    assert.ok(input, 'Input appears when editing');
    assert.equal(input?.value, 'Click me', 'Input has correct value');
  });

  test('enters edit mode on Enter key', async (assert) => {
    const { container, findByRole } = render(
      <EditableText sourceText="Press Enter" />
    );

    const displayElement = await findByRole('button');
    fireEvent.keyDown(displayElement, { key: 'Enter' });

    const input = container.querySelector('input');
    assert.ok(input, 'Input appears on Enter key');
  });

  test('enters edit mode on Space key', async (assert) => {
    const { container, findByRole } = render(
      <EditableText sourceText="Press Space" />
    );

    const displayElement = await findByRole('button');
    fireEvent.keyDown(displayElement, { key: ' ' });

    const input = container.querySelector('input');
    assert.ok(input, 'Input appears on Space key');
  });

  test('calls onEditStart when entering edit mode', async (assert) => {
    let startCalled = false;
    const { findByRole } = render(
      <EditableText 
        sourceText="Test" 
        onEditStart={() => { startCalled = true; }}
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    assert.true(startCalled, 'onEditStart was called');
  });

  test('calls onEditComplete with new text on Enter', async (assert) => {
    let completedText = '';
    const { container, findByRole } = render(
      <EditableText 
        sourceText="Original" 
        onEditComplete={(text) => { completedText = text; }}
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    assert.ok(input, 'Input exists');
    
    fireEvent.change(input!, { target: { value: 'Updated' } });
    fireEvent.keyDown(input!, { key: 'Enter' });

    assert.equal(completedText, 'Updated', 'onEditComplete received new text');
  });

  test('calls onEditCancel on Escape', async (assert) => {
    let cancelCalled = false;
    const { container, findByRole } = render(
      <EditableText 
        sourceText="Test" 
        onEditCancel={() => { cancelCalled = true; }}
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    fireEvent.keyDown(input!, { key: 'Escape' });

    assert.true(cancelCalled, 'onEditCancel was called');
  });

  test('reverts to original text on Escape', async (assert) => {
    const { container, findByRole, findByText } = render(
      <EditableText sourceText="Original" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    fireEvent.change(input!, { target: { value: 'Changed' } });
    fireEvent.keyDown(input!, { key: 'Escape' });

    // Should show original text after cancel
    assert.dom(await findByText('Original')).exists();
  });

  test('saves on blur', async (assert) => {
    let completedText = '';
    const { container, findByRole } = render(
      <EditableText 
        sourceText="Original" 
        onEditComplete={(text) => { completedText = text; }}
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    fireEvent.change(input!, { target: { value: 'Blurred' } });
    fireEvent.blur(input!);

    assert.equal(completedText, 'Blurred', 'onEditComplete called on blur');
  });

  test('calls onChange during editing', async (assert) => {
    const changes: string[] = [];
    const { container, findByRole } = render(
      <EditableText 
        sourceText="Test" 
        onChange={(text) => { changes.push(text); }}
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    fireEvent.change(input!, { target: { value: 'A' } });
    fireEvent.change(input!, { target: { value: 'AB' } });

    assert.deepEqual(changes, ['A', 'AB'], 'onChange called for each change');
  });

  test('uses custom DisplayWrapper', async (assert) => {
    const CustomWrapper = ({ sourceText }: { sourceText: string }) => (
      <strong data-testid="custom-wrapper">{sourceText.toUpperCase()}</strong>
    );

    const { findByTestId } = render(
      <EditableText 
        sourceText="hello" 
        DisplayWrapper={CustomWrapper}
      />
    );

    const wrapper = await findByTestId('custom-wrapper');
    assert.dom(wrapper).hasText('HELLO');
  });

  test('renders textarea in multiLine mode', async (assert) => {
    const { container, findByRole } = render(
      <EditableText sourceText="Multi\nLine" multiLine />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const textarea = container.querySelector('textarea');
    assert.ok(textarea, 'Textarea appears in multiLine mode');
  });

  test('shift+enter creates line break in multiLine mode', async (assert) => {
    const { container, findByRole, findByText } = render(
      <EditableText 
        sourceText="Line1" 
        multiLine
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const textarea = container.querySelector('textarea');
    assert.ok(textarea, 'Textarea exists');

    // Shift+Enter should NOT trigger save (still in edit mode)
    fireEvent.keyDown(textarea!, { key: 'Enter', shiftKey: true });
    assert.ok(container.querySelector('textarea'), 'Still editing after shift+enter');

    // Regular Enter should save and exit edit mode
    fireEvent.keyDown(textarea!, { key: 'Enter', shiftKey: false });
    assert.notOk(container.querySelector('textarea'), 'No longer editing after regular enter');
    assert.dom(await findByText('Line1')).exists('Display shows text after save');
  });

  test('enter saves in single-line mode regardless of shift', async (assert) => {
    const { container, findByRole, findByText } = render(
      <EditableText sourceText="SingleLine" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    // Even with shift pressed, Enter should exit edit mode in single-line
    fireEvent.keyDown(input!, { key: 'Enter', shiftKey: true });

    assert.notOk(container.querySelector('input'), 'No longer editing after shift+enter');
    assert.dom(await findByText('SingleLine')).exists('Display shows text after save');
  });

  test('disabled state prevents editing', async (assert) => {
    const onEditStart = () => { throw new Error('Should not be called'); };
    
    const { container, findByRole } = render(
      <EditableText 
        sourceText="Disabled" 
        disabled
        onEditStart={onEditStart}
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    // Should not enter edit mode
    const input = container.querySelector('input');
    assert.notOk(input, 'No input when disabled');
  });

  test('disabled element has tabIndex -1', async (assert) => {
    const { findByRole } = render(
      <EditableText sourceText="Disabled" disabled />
    );

    const displayElement = await findByRole('button');
    assert.dom(displayElement).hasAttribute('tabindex', '-1');
  });

  test('does not call onEditComplete if text unchanged', async (assert) => {
    let callCount = 0;
    const { container, findByRole } = render(
      <EditableText 
        sourceText="Same" 
        onEditComplete={() => { callCount++; }}
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    // Don't change the text, just press Enter
    fireEvent.keyDown(input!, { key: 'Enter' });

    assert.equal(callCount, 0, 'onEditComplete not called when text unchanged');
  });

  test('applies custom className', async (assert) => {
    const { container } = render(
      <EditableText sourceText="Styled" className="custom-class" />
    );

    const wrapper = container.firstChild as HTMLElement;
    assert.ok(wrapper.classList.contains('custom-class'), 'Has custom class');
  });

  test('applies inputClassName in edit mode', async (assert) => {
    const { container, findByRole } = render(
      <EditableText sourceText="Input" inputClassName="input-custom" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const input = container.querySelector('input');
    assert.ok(input?.classList.contains('input-custom'), 'Input has custom class');
  });

  test('input is focused and selected when entering edit mode', async (assert) => {
    const { container, findByRole } = render(
      <EditableText sourceText="Select me" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    await waitFor(() => {
      const input = container.querySelector('input') as HTMLInputElement;
      assert.equal(document.activeElement, input, 'Input is focused');
    });
  });

  test('has correct aria-label', async (assert) => {
    const { findByRole } = render(
      <EditableText sourceText="Labeled" aria-label="Edit title" />
    );

    const displayElement = await findByRole('button');
    assert.dom(displayElement).hasAttribute('aria-label', 'Edit title');
  });
});

