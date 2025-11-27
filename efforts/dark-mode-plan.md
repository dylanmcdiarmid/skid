# Dark Mode Implementation Plan


### What's Already Working ✅

1. **Theme Infrastructure**: `ThemeProvider` and `ModeToggle` are properly set up
2. **CSS Variables**: Comprehensive light and dark mode CSS variables defined in `index.css`
3. **ShadCN Components**: All UI components in `client/src/components/ui/` support dark mode out of the box
4. **Most Custom Components**: Many custom components already use proper theme-aware classes

### Phase 0: Color System Refinement 

1. **Semantic Token Expansion**
   - Adding more semantic tokens for common patterns
   - Example: `--color-hover-light`, `--color-hover-dark`
   - Example: `--color-focus-ring-light`, `--color-focus-ring-dark`

   Come up with a list of useful semantic tokens, add them, and use them where appropriate in the following phases.


### Components Needing Dark Mode Updates

#### 1. **editable-text.tsx** (client/src/components/editable-text.tsx)
**Issues:**
- Line 160: Hardcoded `bg-white` without dark variant
  ```tsx
  className: `... bg-white ... dark:bg-neutral-900 ${inputClassName}`,
  ```
  - Already has `dark:bg-neutral-900` - **GOOD**
  - But using specific color values instead of design system tokens

- Line 197: Uses `text-neutral-400` for placeholder/empty state
  - May need verification in dark mode

- Make sure to check border colors

**Severity:** Low (already has dark mode class, just needs consistency check)

---

#### 2. **data-table.tsx** (client/src/components/data-table/data-table.tsx)
**Issues:**
- Line 222: Header hover effect missing dark variant
  ```tsx
  'cursor-pointer select-none hover:bg-neutral-200',
  ```
  Should be: `hover:bg-neutral-200 dark:hover:bg-neutral-700`

- Line 258: Row focus styling - **ALREADY FIXED** ✅
  ```tsx
  'bg-neutral-100 ring-1 ring-brand-accent ring-inset dark:bg-neutral-800',
  ```

- Line 291: Expand button hover missing dark variant
  ```tsx
  className="rounded p-1 hover:bg-neutral-200"
  ```
  Should be: `hover:bg-neutral-200 dark:hover:bg-neutral-700`

- Line 318: Expanded row background missing dark variant
  ```tsx
  <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
  ```
  Should be: `bg-neutral-50/50 hover:bg-neutral-50/50 dark:bg-neutral-900/50 dark:hover:bg-neutral-900/50`

- Line 354: Loading overlay missing dark variant
  ```tsx
  <div className="... bg-white/50 backdrop-blur-[1px]">
  ```
  Should be: `bg-white/50 dark:bg-neutral-950/50 backdrop-blur-[1px]`

**Severity:** High (multiple visual issues in dark mode)

---

#### 3. **pagination.tsx** (client/src/components/data-table/pagination.tsx)
**Issues:**
- Line 70: Info text may be too light in dark mode
  ```tsx
  <div className="text-neutral-500 text-sm">
  ```
  Consider: `text-neutral-500 dark:text-neutral-400`

- Line 90: Ellipsis text may be too light in dark mode
  ```tsx
  <span className="px-2 text-neutral-400" ...>
  ```
  Consider: `text-neutral-400 dark:text-neutral-500`

- Line 100: Current page button uses hardcoded colors
  ```tsx
  'pointer-events-none bg-brand-accent text-white hover:bg-brand-accent/90'
  ```
  This actually works for both modes since brand-accent is consistent

**Severity:** Low (mostly cosmetic, readable in both modes)

---

#### 4. **search-input.tsx** (client/src/components/data-table/search-input.tsx)
**Issues:**
- Line 36: Icon color may need dark mode variant
  ```tsx
  <MagnifyingGlassIcon className="... text-neutral-400" />
  ```
  Consider: `text-neutral-400 dark:text-neutral-500`

**Severity:** Very Low (icons typically readable in both modes)

---

#### 5. **sortable-list.tsx** (client/src/components/sortable-list.tsx)
- Line 322 has proper dark variants:
  ```tsx
  'border-neutral-200 text-neutral-500 ... dark:border-neutral-800 dark:hover:border-brand-accent'
  ```
- Make sure to check border colors in the demo, as right now they seem to be getting lost in dark mode

---

## Strategy for Complete Dark Mode Support

### Phase 1: Quick Wins (Immediate)

**Goal:** Fix the most visible issues with minimal risk

1. **Update data-table.tsx hover states**
   - Add `dark:hover:bg-neutral-700` to table header hover (line 222)
   - Add `dark:hover:bg-neutral-700` to expand button (line 291)
   - Add dark variants to expanded row background (line 318)
   - Add dark variant to loading overlay (line 354)

2. **Verify editable-text.tsx**
   - Test the existing dark mode implementation
   - Consider using design system tokens instead of direct neutral colors

3. Check border colors in all demos, and their corresponding components

**Estimated Time:** 30 minutes

---

### Phase 2: Design System Consistency (Short-term)

**Goal:** Ensure all components use design system tokens consistently

1. **Create a color mapping reference**
   - Document when to use `bg-bg-surface` vs `bg-neutral-*`
   - Document when to use `text-text-primary` vs `text-neutral-*`
   - Document semantic color usage (`text-muted-foreground`, etc.)

2. **Audit all custom components**
   - Replace hardcoded neutral colors with design system tokens where appropriate
   - Ensure all `neutral-*` colors have dark: variants

3. **Add dark mode variants to all hover/focus states**
   - Search for all `hover:bg-` that don't have `dark:` variants
   - Search for all `focus:bg-` that don't have `dark:` variants

**Estimated Time:** 2-3 hours

---

### Phase 3: Prevention & Testing (Ongoing)

**Goal:** Prevent dark mode issues in future development

#### 1. **ESLint/Biome Rule** (Recommended)
Create a custom rule or checklist to catch:
- `bg-white` without `dark:bg-*`
- `bg-neutral-*` without `dark:bg-*`
- `text-neutral-*` without `dark:text-*`
- `hover:bg-neutral-*` without `dark:hover:bg-*`

---

---

## Quick Reference: Common Pattern Fixes

### Pattern 1: Background Hover States
```tsx
// ❌ Before
className="hover:bg-neutral-200"

// ✅ After
className="hover:bg-neutral-200 dark:hover:bg-neutral-700"
```

### Pattern 2: Background Colors
```tsx
// ❌ Before
className="bg-white"

// ✅ After
className="bg-white dark:bg-neutral-900"
// OR (preferred if design system supports it)
className="bg-bg-surface"
```

### Pattern 3: Text Colors
```tsx
// ❌ Before
className="text-neutral-500"

// ✅ After
className="text-neutral-500 dark:text-neutral-400"
// OR (preferred)
className="text-text-secondary"
```

### Pattern 4: Semi-transparent Overlays
```tsx
// ❌ Before
className="bg-white/50"

// ✅ After
className="bg-white/50 dark:bg-neutral-950/50"
```

---