import React, {
  type CSSProperties,
  forwardRef,
  type MutableRefObject,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

function normalizeHtml(str: string): string {
  return str?.replace(/&nbsp;|\u202F|\u00A0/g, ' ').replace(/<br \/>/g, '<br>');
}

function replaceCaret(el: HTMLElement) {
  // Place the caret at the end of the element
  const target = document.createTextNode('');
  el.appendChild(target);
  // Do not move caret if element was not focused
  const isTargetFocused = document.activeElement === el;
  if (target !== null && target.nodeValue !== null && isTargetFocused) {
    const sel = window.getSelection();
    if (sel !== null) {
      const range = document.createRange();
      range.setStart(target, target.nodeValue.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (el instanceof HTMLElement) {
      el.focus();
    }
  }
}

export type ContentEditableEvent = SyntheticEvent<any, Event> & {
  target: { value: string };
};

export interface Props
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'onInput'> {
  html: string;
  disabled?: boolean;
  tagName?: string;
  className?: string;
  style?: CSSProperties;
  innerRef?:
    | RefObject<HTMLElement | null>
    | ((instance: HTMLElement | null) => void);
  onChange?: (event: ContentEditableEvent) => void;
  autoFocus?: boolean;
}

const ContentEditable = forwardRef<HTMLElement, Props>((props, ref) => {
  const {
    html,
    tagName = 'div',
    disabled,
    innerRef,
    onChange,
    onBlur,
    onKeyUp,
    onKeyDown,
    autoFocus,
    ...rest
  } = props;

  const elRef = useRef<HTMLElement | null>(null);
  const lastHtmlRef = useRef(html);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      elRef.current = node;

      // Handle forwarded ref
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<HTMLElement | null>).current = node;
      }

      // Handle legacy innerRef
      if (typeof innerRef === 'function') {
        innerRef(node);
      } else if (innerRef) {
        (innerRef as MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [ref, innerRef]
  );

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) {
      return;
    }

    // If the html really changed (programmatically), update it.
    if (normalizeHtml(html) !== normalizeHtml(el.innerHTML)) {
      el.innerHTML = html;
      replaceCaret(el);
    }
    lastHtmlRef.current = html;
  }, [html]);

  useLayoutEffect(() => {
    if (autoFocus && elRef.current) {
      elRef.current.focus();
      replaceCaret(elRef.current);
    }
  }, [autoFocus]);

  const emitChange = useCallback(
    (originalEvt: SyntheticEvent<any>) => {
      const el = elRef.current;
      if (!el) {
        return;
      }

      const currentHtml = el.innerHTML;
      if (onChange && currentHtml !== lastHtmlRef.current) {
        // Create a custom event that mimics the expected shape
        const evt = {
          ...originalEvt,
          target: {
            ...originalEvt.target,
            value: currentHtml,
          },
        } as unknown as ContentEditableEvent;
        onChange(evt);
      }
      lastHtmlRef.current = currentHtml;
    },
    [onChange]
  );

  return React.createElement(tagName, {
    ...rest,
    ref: handleRef,
    contentEditable: rest.contentEditable ?? !disabled,
    onInput: emitChange,
    onBlur: onBlur || emitChange,
    onKeyUp: onKeyUp || emitChange,
    onKeyDown: onKeyDown || emitChange,
    suppressContentEditableWarning: true,
  });
});

ContentEditable.displayName = 'ContentEditable';

export default ContentEditable;
