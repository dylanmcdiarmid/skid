import { fireEvent } from '@testing-library/react';
import { render } from '@tests/test-utils';
import QUnit from 'qunit';
import { ClickableSeamlessEditor } from './clickable-seamless-editor';

const { module, test } = QUnit;

module('Component | ClickableSeamlessEditor', () => {
  test('renders display text when not editing', async (assert) => {
    const { findByText } = render(
      <ClickableSeamlessEditor sourceText="Hello World" />
    );

    assert.dom(await findByText('Hello World')).exists();
  });

  test('shows placeholder when sourceText is empty', async (assert) => {
    const { findByText } = render(
      <ClickableSeamlessEditor placeholder="Enter text..." sourceText="" />
    );

    assert.dom(await findByText('Enter text...')).exists();
  });

  test('enters edit mode on click', async (assert) => {
    const { container, findByRole } = render(
      <ClickableSeamlessEditor sourceText="Click me" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    assert.ok(editor, 'Editor appears when editing');
    assert.equal(
      editor?.textContent,
      'Click me',
      'Editor has correct text content'
    );
  });

  test('enters edit mode on Enter key', async (assert) => {
    const { container, findByRole } = render(
      <ClickableSeamlessEditor sourceText="Press Enter" />
    );

    const displayElement = await findByRole('button');
    fireEvent.keyDown(displayElement, { key: 'Enter' });

    const editor = container.querySelector('[contenteditable]');
    assert.ok(editor, 'Editor appears on Enter key');
  });

  test('enters edit mode on Space key', async (assert) => {
    const { container, findByRole } = render(
      <ClickableSeamlessEditor sourceText="Press Space" />
    );

    const displayElement = await findByRole('button');
    fireEvent.keyDown(displayElement, { key: ' ' });

    const editor = container.querySelector('[contenteditable]');
    assert.ok(editor, 'Editor appears on Space key');
  });

  test('calls onEditStart when entering edit mode', async (assert) => {
    let startCalled = false;
    const { findByRole } = render(
      <ClickableSeamlessEditor
        onEditStart={() => {
          startCalled = true;
        }}
        sourceText="Test"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    assert.true(startCalled, 'onEditStart was called');
  });

  test('calls onEditComplete with new text on Enter', async (assert) => {
    let completedText = '';
    const { container, findByRole } = render(
      <ClickableSeamlessEditor
        onEditComplete={(text) => {
          completedText = text;
        }}
        sourceText="Original"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    assert.ok(editor, 'Editor exists');

    // Simulate typing
    if (editor) {
      editor.innerHTML = 'Updated';
      fireEvent.input(editor);
      fireEvent.keyDown(editor, { key: 'Enter' });
    }

    assert.equal(completedText, 'Updated', 'onEditComplete received new text');
  });

  test('calls onEditCancel on Escape', async (assert) => {
    let cancelCalled = false;
    const { container, findByRole } = render(
      <ClickableSeamlessEditor
        onEditCancel={() => {
          cancelCalled = true;
        }}
        sourceText="Test"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    if (editor) {
      fireEvent.keyDown(editor, { key: 'Escape' });
    }

    assert.true(cancelCalled, 'onEditCancel was called');
  });

  test('reverts to original text on Escape', async (assert) => {
    const { container, findByRole, findByText } = render(
      <ClickableSeamlessEditor sourceText="Original" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    if (editor) {
      editor.innerHTML = 'Changed';
      fireEvent.input(editor);
      fireEvent.keyDown(editor, { key: 'Escape' });
    }

    // Should show original text after cancel
    assert.dom(await findByText('Original')).exists();
  });

  test('saves on blur', async (assert) => {
    let completedText = '';
    const { container, findByRole } = render(
      <ClickableSeamlessEditor
        onEditComplete={(text) => {
          completedText = text;
        }}
        sourceText="Original"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    if (editor) {
      editor.innerHTML = 'Blurred';
      fireEvent.input(editor);
      fireEvent.blur(editor);
    }

    assert.equal(completedText, 'Blurred', 'onEditComplete called on blur');
  });

  test('calls onChange during editing', async (assert) => {
    const changes: string[] = [];
    const { container, findByRole } = render(
      <ClickableSeamlessEditor
        onChange={(text) => {
          changes.push(text);
        }}
        sourceText="Test"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    if (editor) {
      editor.innerHTML = 'A';
      fireEvent.input(editor);
      editor.innerHTML = 'AB';
      fireEvent.input(editor);
    }

    assert.deepEqual(changes, ['A', 'AB'], 'onChange called for each change');
  });

  test('uses custom DisplayWrapper', async (assert) => {
    const CustomWrapper = ({ sourceText }: { sourceText: string }) => (
      <strong data-testid="custom-wrapper">{sourceText.toUpperCase()}</strong>
    );

    const { findByTestId } = render(
      <ClickableSeamlessEditor
        DisplayWrapper={CustomWrapper}
        sourceText="hello"
      />
    );

    const wrapper = await findByTestId('custom-wrapper');
    assert.dom(wrapper).hasText('HELLO');
  });

  test('multiLine mode allows Shift+Enter', async (assert) => {
    // Note: We can't easily test line breaks in JSDOM contenteditable the same way as textarea
    // But we can test that Shift+Enter DOES NOT trigger save (i.e. editor stays open)

    const { container, findByRole } = render(
      <ClickableSeamlessEditor multiLine sourceText="Line1" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    assert.ok(editor, 'Editor exists');

    if (editor) {
      // Shift+Enter should NOT trigger save (still in edit mode)
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });
    }

    assert.ok(
      container.querySelector('[contenteditable]'),
      'Still editing after shift+enter'
    );

    if (editor) {
      // Regular Enter should save and exit edit mode
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });
    }

    assert.notOk(
      container.querySelector('[contenteditable]'),
      'No longer editing after regular enter'
    );
  });

  test('enter saves in single-line mode regardless of shift', async (assert) => {
    const { container, findByRole, findByText } = render(
      <ClickableSeamlessEditor sourceText="SingleLine" />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');

    if (editor) {
      // Even with shift pressed, Enter should exit edit mode in single-line (default false for multiLine)
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });
    }

    assert.notOk(
      container.querySelector('[contenteditable]'),
      'No longer editing after shift+enter'
    );
    assert
      .dom(await findByText('SingleLine'))
      .exists('Display shows text after save');
  });

  test('disabled state prevents editing', async (assert) => {
    const onEditStart = () => {
      throw new Error('Should not be called');
    };

    const { container, findByRole } = render(
      <ClickableSeamlessEditor
        disabled
        onEditStart={onEditStart}
        sourceText="Disabled"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    // Should not enter edit mode
    const editor = container.querySelector('[contenteditable]');
    assert.notOk(editor, 'No editor when disabled');
  });

  test('disabled element has tabIndex -1', async (assert) => {
    const { findByRole } = render(
      <ClickableSeamlessEditor disabled sourceText="Disabled" />
    );

    const displayElement = await findByRole('button');
    assert.dom(displayElement).hasAttribute('tabindex', '-1');
  });

  test('applies custom className', async (assert) => {
    const { container } = render(
      <ClickableSeamlessEditor className="custom-class" sourceText="Styled" />
    );

    const wrapper = container.firstChild as HTMLElement;
    assert.ok(wrapper.classList.contains('custom-class'), 'Has custom class');
  });

  test('applies inputClassName in edit mode', async (assert) => {
    const { container, findByRole } = render(
      <ClickableSeamlessEditor
        inputClassName="input-custom"
        sourceText="Input"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    assert.ok(
      editor?.classList.contains('input-custom'),
      'Editor has custom class'
    );
  });

  test('has correct aria-label', async (assert) => {
    const { findByRole } = render(
      <ClickableSeamlessEditor aria-label="Edit title" sourceText="Labeled" />
    );

    const displayElement = await findByRole('button');
    assert.dom(displayElement).hasAttribute('aria-label', 'Edit title');
  });

  test('saves when clicking outside', async (assert) => {
    let completedText = '';
    const { container, findByRole } = render(
      <ClickableSeamlessEditor
        onEditComplete={(text) => {
          completedText = text;
        }}
        sourceText="Original"
      />
    );

    const displayElement = await findByRole('button');
    fireEvent.click(displayElement);

    const editor = container.querySelector('[contenteditable]');
    if (editor) {
      editor.innerHTML = 'ClickOutside';
      fireEvent.input(editor);

      // Simulate click outside
      fireEvent.mouseDown(document.body);
    }

    assert.equal(
      completedText,
      'ClickOutside',
      'onEditComplete called on click outside'
    );
  });
});
