import {
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useClickOutside } from '../hooks/use-click-outside';
import { SeamlessEditor } from './seamless-editor';

export interface ClickableSeamlessEditorProps {
  /** The source text to display and edit */
  sourceText: string;
  /** Component to wrap the display text. Receives sourceText as a prop */
  DisplayWrapper?: ComponentType<{ sourceText: string; children?: ReactNode }>;
  /** Whether to use multi-line mode. If false, Enter saves. If true, Enter saves unless Shift is held. */
  multiLine?: boolean;
  /** Called when editing is complete with the new text */
  onEditComplete?: (newText: string) => void;
  /** Called when editing starts */
  onEditStart?: () => void;
  /** Called when editing is cancelled (Escape key) */
  onEditCancel?: () => void;
  /** Called when the text changes during editing */
  onChange?: (text: string) => void;
  /** Placeholder text shown when sourceText is empty */
  placeholder?: string;
  /** Additional class name for the container */
  className?: string;
  /** Additional class name for the editor element */
  inputClassName?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Accessible label for the editable text */
  'aria-label'?: string;
}

const DefaultDisplayWrapper = ({
  sourceText,
}: {
  sourceText: string;
  children?: ReactNode;
}) => <span>{sourceText}</span>;

export function ClickableSeamlessEditor({
  sourceText,
  DisplayWrapper = DefaultDisplayWrapper,
  multiLine = false,
  onEditComplete,
  onEditStart,
  onEditCancel,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
  inputClassName = '',
  disabled = false,
  'aria-label': ariaLabel,
}: ClickableSeamlessEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(sourceText);
  const containerRef = useRef<HTMLDivElement>(null);

  // We don't need a ref to the input for focus management because SeamlessEditor
  // accepts autoFocus prop, but we might want one if we needed imperative control.
  // For now, we'll rely on autoFocus={true}.

  // Sync editValue with sourceText when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(sourceText);
    }
  }, [sourceText, isEditing]);

  const startEditing = useCallback(() => {
    if (disabled) {
      return;
    }
    setIsEditing(true);
    setEditValue(sourceText);
    if (onEditStart) {
      onEditStart();
    }
  }, [disabled, sourceText, onEditStart]);

  const saveEdit = useCallback(() => {
    // If we are not editing, do nothing. This prevents double saves from blur + click outside
    if (!isEditing) {
      return;
    }

    setIsEditing(false);
    if (editValue !== sourceText) {
      onEditComplete?.(editValue);
    } else {
      onEditCancel?.();
    }
  }, [isEditing, editValue, sourceText, onEditComplete, onEditCancel]);

  const cancelEdit = useCallback(() => {
    if (!isEditing) {
      return;
    }

    setIsEditing(false);
    setEditValue(sourceText);
    onEditCancel?.();
  }, [isEditing, sourceText, onEditCancel]);

  // Handle clicks outside the component to save
  useClickOutside(containerRef, () => {
    if (isEditing) {
      saveEdit();
    }
  });

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
        return;
      }

      if (event.key === 'Enter') {
        // Standard behavior: Enter saves. Shift+Enter adds newline if multiLine is true.
        // SeamlessEditor (ContentEditable) adds div/br on Enter by default.
        // We want to prevent that if we are saving.

        if (multiLine && event.shiftKey) {
          // Allow default behavior (newline)
          return;
        }

        // Otherwise save
        event.preventDefault();
        saveEdit();
      }
    },
    [multiLine, saveEdit, cancelEdit]
  );

  const handleChange = useCallback(
    (newValue: string) => {
      setEditValue(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    saveEdit();
  }, [saveEdit]);

  const handleDisplayClick = useCallback(() => {
    startEditing();
  }, [startEditing]);

  const handleDisplayKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        startEditing();
      }
    },
    [startEditing]
  );

  if (isEditing) {
    return (
      <div className={className} ref={containerRef}>
        <SeamlessEditor
          autoFocus
          className={`w-full rounded border border-brand-accent bg-bg-surface px-2 py-1 text-sm outline-none ring-2 ring-brand-accent/20 focus:ring-brand-accent/40 ${inputClassName}`}
          disabled={disabled}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          tagName="div"
          value={editValue}
        />
      </div>
    );
  }

  const displayText = sourceText || placeholder;
  const isEmpty = !sourceText;

  return (
    <button
      aria-label={ariaLabel ?? 'Click to edit'}
      className={`w-full cursor-pointer text-left transition-colors hover:bg-hover-subtle ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
      disabled={disabled}
      onClick={handleDisplayClick}
      onKeyDown={handleDisplayKeyDown}
      tabIndex={disabled ? -1 : 0}
      type="button"
    >
      <DisplayWrapper sourceText={displayText}>
        <span className={isEmpty ? 'text-text-placeholder italic' : ''}>
          {displayText}
        </span>
      </DisplayWrapper>
    </button>
  );
}
