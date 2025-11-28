import type React from 'react';
import { useCallback } from 'react';
import ContentEditable, {
  type ContentEditableEvent,
} from './content-editable-text';

interface SeamlessEditorProps {
  /** The plain text value to edit */
  value: string;
  /** Called when the text changes */
  onChange: (value: string) => void;
  /** The tag name to use for the wrapper element (default: 'div') */
  tagName?: string;
  /** Additional class names */
  className?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Placeholder text (note: requires CSS to show, usually :empty:before) */
  placeholder?: string;
  /** Called when the editor loses focus */
  onBlur?: () => void;
  /** Called on key down */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Whether to auto-focus on mount */
  autoFocus?: boolean;
}

const escapeHtml = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
};

const unescapeHtml = (str: string) => {
  // Replace <br> with \n before parsing text content to preserve line breaks
  const withNewlines = str.replace(/<br\s*\/?>/gi, '\n');
  const doc = new DOMParser().parseFromString(withNewlines, 'text/html');
  return doc.documentElement.textContent || '';
};

/**
 * A wrapper around ContentEditable that handles plain text editing.
 * It ensures that the input is treated as source text rather than HTML.
 * It also handles newline conversion between \n and <br>.
 */
export function SeamlessEditor({
  value,
  onChange,
  tagName = 'div',
  className,
  disabled,
  onBlur,
  onKeyDown,
  autoFocus,
  ...rest
}: SeamlessEditorProps) {
  const handleChange = useCallback(
    (e: ContentEditableEvent) => {
      // The value coming from ContentEditable is innerHTML.
      const newValue = unescapeHtml(e.target.value);
      onChange(newValue);
    },
    [onChange]
  );

  // When passing value to ContentEditable, we must escape it because ContentEditable sets innerHTML.
  // We also convert newlines to <br> for display.
  const html = escapeHtml(value);

  return (
    <ContentEditable
      autoFocus={autoFocus}
      className={className}
      contentEditable="plaintext-only"
      disabled={disabled}
      html={html}
      onBlur={onBlur}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      tagName={tagName}
      {...rest}
    />
  );
}
