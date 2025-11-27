# Get stuff rendering effort
- [x] Rewrite Users so it's just a generic page
- [x] Load and serve index.html wrapper
Routes that start with /api will be calls to the api, everything else not matched afterwards should be considered a route that will be handled by the SPA, so we should just serve the html and let the SPA take over.
- [x] Send down global for development mode so we can show component demo pages
- [x] Cachebust!
- [x] Add component demo pages to the sidebar
- [ ] Data table based on TanStack Table
  - filtering
  - pagination


# Data Table
We'll be using Tanstack Table, which should already be available in the project (@tanstack/react-table)
Read the `use-paginated-fetcher.ts` as it allows us to setup pre-fetching / client side cached data in an elegant way, and also is very testable (being able to provide your own fetch).

Decide where we need to 
- install new shadcn component (may not be needed)
- use existing components (listed in client/src/components/ui) 
- can just use vanilla components

If we need to install a new shadcn component, use `bunx shadcn add foo`. Style with tailwind.

## Data Table Component
I'd like to make a lightweight data table component. We want the data table to accept a clear data structure that defines

## Pagination Component
Pagination component should show a previous button, then page numbers (truncated). If we detect we are truncating.
It should also have a display option for showing `Page 2 of 99` beneath it.
`[<] [1] [*2*] [3] [...] [99] [>]`

The pagination component should have different disable modes. One is for if we are changing the list (so the pages are likely to change), the other is if we are just changing a page in the same set (the pages are unlikely to change). If we know the page amount won't change, we can let the user click a different page even when their current request is loading.

# Data table planning query
I'd like you to help me spec a data table component.

As far as fetching data, I have a react hook that helps pull in the correct data in a paginated form, and also helps with caching. Data will always be considered "server-side", even though in related sometimes it will be retrieved from a local cache.

For design, it should be utilitarian. We have full access to ShadCN components and should use them where appropriate (although we do not want to use their data table, as it uses Tanstack Table which is overkill for our needs). I'd like you to think about what ShadCN components we should use, if any, or if it's better just to use vanilla components ane style them with tailwind.

Here's the features I'd like more help specifying

- Optionally enabling sorting for some columns
- A search box that allows filtering (with the ability to customize what information gets searched for any given row).
- Any sort or filter operations should be done on the "server" (which will sometimes not actually need to go to the server, but Tanstack shouldn't need to worry about that)
- Ensuring we have good intermediate "loading" states (don't know if we need to hook into TanStack at all for that)
- Optional support for expanding a row. An expanded row can show an element that is not a "part" of the table (so it could show an image or whatever really)
- Two different ways to "select" a row. One way is more of a "focus", where the user's keyboard input can do things to the row, like trigger expanding it. The second way is for batch processing, more of a "checkbox" select.

I'd like you to help plan out in Typescript what data structures the wrapper should accept as the "simpler" interface to TanStack, and then maybe how this simpler interface would translate into TanStack structures.

The component that triggers loading a new page will be separate from the data table so we can re-use it for views that don't need the data table. I know Tanstack has pagination built in, will we need to integrate with that at all or can we just manage it separately?

# Drag/drop sortable list
- Should use dnd-kit and shadcn. dnd-kit will need to be added. Anything from the shadcn library can also be installed
- Each item in the list should have a drag handle it can use for reordering 
- Each item in the list should be required to have a unique id
- We should be able to pass in a custom element to use as the wrapper for the list. The custom element will always receive the list item id as an attribute.
- State management should be done using jotai
- We should be able to access the data in the list, in the format { id: <unique_id> , sortOrder: <0 indexed sort order> }
- We should write tests for the component. You can see an example test for a simple component app-sidebar.test.tsx

# Editable Text component
We want a "click to edit the text" component. This component should take the "source text" along with a displayWrapper component, that will accept sourceText as an attribute. When you go into edit mode you edit the source text. The text may be simple markup so it may be displayed a bit differently than it looks. 

We should have a single-line or muti-line mode. In Multi-line mode, "shift+enter" should create a line break. In both modes, hitting enter saves the changes.

We should have onEditComplete, and any other "on" functions you think are approriate.

We should make sure to have unit tests, and also to add a demo page and link in sidebar in the same way we did with the SortableList component.

# Sortable List add/remove
We have a couple of optional features we want to enable on a sortable list. The first is we should be able to trigger an item for removal from the list. By default, if this feature is enabled, pressing "delete" while hovering over the list item with the mouse should remove the item. We should also have a way to temporarily disable deletion (for our use case we may be in an "editing" mode where we need to disable accidental deletion while typing).

The other is we should be able to add a list item. In this mode, new items are prefixed with new:<uuid>. We can add a uuid package to support this. This functionality would usually be used in conjunction with EditableText, so maybe when we create a demo for it we can show that use case (building a list from scratch or updating a list). And speaking of demo, let's make a new one called "Editable List", similar to our other demos.

We should also update our existing sortable list unit tests.


# Pages effort
 - [x] Create sidebar
  - [x] Create pages to enable sidebar