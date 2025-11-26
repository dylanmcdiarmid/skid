import {
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface EditableTextProps {
  /** The source text to display and edit */
  sourceText: string;
  /** Component to wrap the display text. Receives sourceText as a prop */
  DisplayWrapper?: ComponentType<{ sourceText: string; children?: ReactNode }>;
  /** Whether to use multi-line mode (textarea) or single-line mode (input) */
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
  /** Additional class name for the input/textarea */
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

export function EditableText({
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
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(sourceText);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync editValue with sourceText when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(sourceText);
    }
  }, [sourceText, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (disabled) {
      return;
    }
    setIsEditing(true);
    setEditValue(sourceText);
    onEditStart?.();
  }, [disabled, sourceText, onEditStart]);

  const saveEdit = useCallback(() => {
    setIsEditing(false);
    if (editValue !== sourceText) {
      onEditComplete?.(editValue);
    }
  }, [editValue, sourceText, onEditComplete]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue(sourceText);
    onEditCancel?.();
  }, [sourceText, onEditCancel]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
        return;
      }

      if (event.key === 'Enter') {
        if (multiLine && event.shiftKey) {
          // Allow shift+enter for line breaks in multi-line mode
          return;
        }
        event.preventDefault();
        saveEdit();
      }
    },
    [multiLine, saveEdit, cancelEdit]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
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

  const commonInputProps = {
    value: editValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    placeholder,
    'aria-label': ariaLabel ?? 'Edit text',
    className: `w-full rounded border border-amber-500 bg-white px-2 py-1 text-sm outline-none ring-2 ring-amber-500/20 focus:ring-amber-500/40 dark:bg-neutral-900 ${inputClassName}`,
  };

  if (isEditing) {
    return (
      <div className={className}>
        {multiLine ? (
          <textarea
            {...commonInputProps}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={3}
          />
        ) : (
          <input
            {...commonInputProps}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
          />
        )}
      </div>
    );
  }

  const displayText = sourceText || placeholder;
  const isEmpty = !sourceText;

  return (
    <button
      aria-label={ariaLabel ?? 'Click to edit'}
      className={`w-full cursor-pointer rounded px-2 py-1 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      disabled={disabled}
      onClick={handleDisplayClick}
      onKeyDown={handleDisplayKeyDown}
      tabIndex={disabled ? -1 : 0}
      type="button"
    >
      <DisplayWrapper sourceText={displayText}>
        <span className={isEmpty ? 'text-neutral-400 italic' : ''}>
          {displayText}
        </span>
      </DisplayWrapper>
    </button>
  );
}

export default EditableText;
