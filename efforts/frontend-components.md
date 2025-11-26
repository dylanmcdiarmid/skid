# Get stuff rendering effort
- [x] Rewrite Users so it's just a generic page
- [x] Load and serve index.html wrapper
Routes that start with /api will be calls to the api, everything else not matched afterwards should be considered a route that will be handled by the SPA, so we should just serve the html and let the SPA take over.
- [x] Send down global for development mode so we can show component demo pages
- [x] Cachebust!
- [x] Add component demo pages to the sidebar


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


# Pages effort
 - [x] Create sidebar
  - [x] Create pages to enable sidebar