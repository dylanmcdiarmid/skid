# NOW: What's the "must do" before we can use?
- [ ] API Layer
  - Look at what we've built so far in each section, write a short description, and have claude come up with a recommended API layer
- [ ] Today (Day Instances)
  - [x] Add a brand new item to the practice session instance and template.
  - [x] Make recommended time updated
  - [x] Add context for deleting
  - [x] Add an existing practice session (using the smart practice session screen). In this case, it should be added both to the instance and to the template.
  - [x] Notes at the bottom of each instance. Notes at the bottom of the session. Add API for updating notes
  - [ ] Reset day
- [ ] History (Day Instances)

# LATER: We can wait
- [ ] Planning screen
- [ ] Better hotkey management across the app (react-hotkeys-hook)
  - [ ] Powerful Ctrl+Enter popup
 [ ] Add undo (and make global undo management easier)
- [ ] Custom thing for hover management, maybe using some info from this conversation (elementsFromPoint being an important function) https://claude.ai/chat/19a49915-9ba2-4c5e-8936-5084efe78fcb
  - [ ] Should be easy to "disable" clicks if you aren't the current "main" target
## Maaaaaybe
It's tough to decide whether any time spent here would be better spent doing a vulkan implementation
- [ ] Have a proper "panels" implementation
- [ ] Minimal version of how monaco editor does rendering?

# Day Instance Data

# Notes
Let's add support for adding notes to both the day instance and a practice session instance. Notes are a simple ClickableSeamlessEditor with multiline support. If they are empty, they show the placeholder "(notes)" so it's clear where to click. They should be at the bottom of the practice session instance list, and at the top of the Day Instance (right below "View and track your practice session")

Notes should be saved immediately, check to see if we need to add an API function for this.


schema, sidebar

# Today (Add/Edit Day Instance)
- The "Today" link in the sidebar is actually just either the "Add day instance" page (if the id doesn't exist), or the "view/edit day instance" page, which takes an optional YYYY-MM-DD day instance id in the GET parameters. Users can make a new page or edit an existing page for any page id, but the default will be the "YYYY-MM-DD" for today (in local time zone).

## Mock API
We already have some mock api functions, we should determine if we need more to support the cases we're implementing.

## New Day Instance
You see this view if no day instance exists for the given id (YYYY-MM-DD) format
- Search the day template list. Double click or click an icon that indicates "select" to choose that template.
- This view of the day template data table should use the feature that allows rows to be expanded. The expanded view should show every practice session template associated with that day template, along with each practice session line item, in a compact format (you shouldn't be able to edit or re-arrange anything in this expanded view)
- Like the practice session list view that gets reused with slightly different behavior, we should create a reusable wrapper around the data table component that supports the day template list behavior for using it in the Day Instance creation, as well as its CRUD pages.
- Once you choose a template, the day instance gets saved, and we get sent to the "View/Edit" Instance page. 

## View/Edit Page
For now, view/edit should just be placeholder! It has slightly more complex behavior than what we've done so far, so we'll complete it in another effort. 

# "View/Edit" Day Instance
This is kind of the "main" interface, it is what a user will be on most of the time, so it has a fair amount of functionality. We'll be building this piece by piece. The user's changes here will be saved not just to the practice instance, but also to the practice session template. This helps the user keep the templates and their associated line items up to date without extra steps.


We're viewing a day instance, right now the screen is just a placeholder. Let's start by showing a sortable list containing every practice template associated with that day instance. The practice template should: 
- "display" field used as the title
- recommended time, humanized
- actual time, with human parsing / display. If no time has been logged, it should show "(no time logged)" as the placeholder. We have examples of the time humanizing stuff in the practice session template edit component, so it can be used as a reference.
- Re-arranging the elements should trigger updating both the practice session instance and the practice session template.


# Updates
- We'd like for this page to blend together a bit better, so let's only show the drag icon if have moused over an item. If we need to update the sortable component to allow this, go ahead and do it, otherwise it's fine if we can already control that from the parent rather than the component itselff.
- The times Rec: 20 minutes and "(no time logged)" should be directly under the display title. We can also get rid of the "Rec:" text, and just use the different styling to differentiate
- Let's add the clickable editing to the Practice Session display as well. Changing it should update both the source practice session template and the practice session instance. Check if we need to add anything at the api level to support this.



We will add the rest of the display later, let's get this working first.

- Next we should bring in the practice session list items.
- They should display in their associated templates.
- We should be able to edit their title, their display, or their text.
- Should be able to change sort order by dragging (should be in a sortable list)
- Their items should not have borders.
- We should be able to delete a line item by hovering over it and hiing the "delete" key. This should delete the line item instance and the line item it refers to
- The drag handle should only show on mouseover
- Make sure to check and see if we need to make any api changes to support this

---


### adding notes to the day instance
ClickableContentEditable with placeholder (edit here for new note). 

### new component variation: "hidden" drag handle
we want to be able to drag the whole list item, or just use hotkeys to move it. 

## Deletion
- There should be a "reset" day, that just deletes that day instance. It should require confirmation.


# History (Day Instances)
Our history page allows us to browse our saved day instances. The data table on our Day Templates browser is probably the closest implementation, but we don't need a "Show Disabled" filter, and we don't need "New Day" or anything like that as that's not how day instances are created. When mousing over an item in the list, we should have the edit and delete icons show up (like in the Day Templates data table).

For columns, the equivalent to Display name is "Date". This is actually the id field of the day instance, which is a string in the format YYYY-MM-DD. We should make sure sorting by this column actually sorts by comparing the date, not alpha! So plan carefully around that, and ensure our underlying data table implementation supports it, adding support if it doesn't.

We can also have a "Last Touched", in the same style as Day Templates. When expanding a row, it should show all the practice session instances, along with all the practice session instance line items, in a condensed view, similar to how Day Templates does it. It should also show any notes associated with the Day Instance. 


schema.sql, api/practice-sessions, pages/practice-sessions
# Day Templates
Our practice session templates get organized into "Day Templates". To get this feature going, we're going to take a similar approach to what we did for practice sessions

## List View
- We want our list view / data table to be pretty similar, using the "last touched" derived field. We don't have unique names for day templates.

## Add/Edit View
- Editing a day template will be a bit different. We want a similar sortable list, but we will not be using any editable text within the sortable list (other than for the day template's display name). Instead, when you click the "Add Item" button, it will show the searchable practice session data table, very similar to what's currently on the list view for the practice session page, but in this case all practice session tempaltes will be selectable (which the data table supports). The data table should temporarily "replace" what's on the edit view, rather than being shown in a popover, with the option to either "save" or "cancel". Items that are already in the list should be checked already! Saving then adds the items to the sortable list.

- We may want create a wrapper for the practice session list view that ensures it's suitable for use in both the Practice Session list view, and as this selection tool. Just make sure we take a DRY approach

# Use the markdown component with seamless editing for practice session line item editing
TODO

# Random 
- [ ] Think about whether we need to look for a better way to "popover" an edit screen, for example we may want to go into a practice session edit mode from the Day Template edit screen

# SeamlessEditor Migration
Plan to Replace EditableText with SeamlessEditor

  Based on my analysis, here's the migration plan:

  Key Architectural Differences

  EditableText uses a click-to-edit pattern:
  - Two modes: display (button) + edit (input/textarea)
  - Click to enter edit mode, blur/Enter to save, Escape to cancel
  - Props: sourceText, onEditComplete, onEditStart, onEditCancel, multiLine

  SeamlessEditor uses always-editable inline editing:
  - Always in edit mode (like Notion/Contentful)
  - ContentEditable-based with plaintext-only
  - Props: value, onChange (simpler, controlled component)
  - No click-to-edit, no separate display/edit states

  Migration Scope

  Production code:
  - pages/practice-sessions/editor.tsx - 5 instances (lines 72, 82, 265, 280, 289)

  Demo/test files:
  - pages/demo-editable-text.tsx - 6 instances
  - pages/demo-editable-list.tsx - 1 instance
  - components/editable-text.test.tsx - test suite

## Migration Strategy
  Create a wrapper component that adds click-to-edit behavior to SeamlessEditor:
  1. Create ClickableSeamlessEditor component that:
    - Uses state to track editing mode
    - Shows button in display mode, SeamlessEditor in edit mode
    - Maps EditableText's API to SeamlessEditor's API
  2. This preserves existing UX while using SeamlessEditor internally
  3. Minimal changes to usage sites

  Complex cases (duration parsing, custom styling):
  - May need wrapper div for styling
  - Duration field needs onBlur to trigger parsing
  - Display name needs font styling applied to SeamlessEditor


# Practice Session add/edit screen
The edit screen is almost there, but we need a few updates to make it perfect. Right now we're showing a "Line Items" heading. We're going to condense this a bit. 

- The unique name will now be the only thing in General Information
- Instead of announcing Line Items, we're going to show the display name of the template, and it will be editable in place.
- Beneath it we'll show "53" minutes (or whatever the recommended time is), with 53 being editable. When clicking either the 53, or the time "word" information, we will edit the time. We should be able to put in a human duration, and have it translated into the underlying minute integer. For example if we input "2 hours 15 minutes", it should set the underlying field to 135. But when it's displayed, it should show "2 hours and 15 minutes" or whatever is easiest with humanize-duration. If we need to update the editable-text component to make this easier, then do it. We should use the humanize-duration package to help us with this.
- Other than unique name, and the minutes suffix, we're going to remove labels. The formatting should be enough for the user to feel where they're at. So TITLE and DISPLAY label on the line items should be removed


# TODO definite
- [ ] Editable text Take up full available width, with an optional max width, and try to be smart about height
- [x] Add a render markdown component
- [ ] Update all editable text to be content editable
 
# TODO maybe
- [ ] "Refresh" button for the data table
- [x] There is maybe some weird sorting behavior when clicking columns a few times, they stop toggling sometimes?
- [ ] 

# Practice Session dates
Let's add date generation to our fake data. Our practice session data, both templates at items, should now include created_at, updated_at, and a "last_touched" field that is updated_at if not null, otherwise created_at. We can get good fake data for this by using our createDateStepGenerator function.

This should also be a part of the data types. We should then update our practice session list data table to add the "last touched" column. To display it, we should humanize the dates, using the humanize functions from our date-fns package. It should be our default sort order. In the expanded view, we can show the "actual" date, in the user's local time zone. Last touched should be the default sort column.


# Add updated_at
We've just added updated_at to:
- practice_session_templates
- practice_session_line_items
- practice_session_instances
- practice_session_instance_line_items 
- planning_items
- day_templates
- day_instances

Let's make sure our DAOs and tests are updated to reflect this. Limit these updates to just things in our server side code located in `./src/`, ignoring anything in `./client/`


# Practice Sessions Add/Edit
Now that we've got generators done, we'll use that work to start build out our next page. Just like the generators, we should use fake data on our API layer until we are ready to integrate with the backend.

Unlike generator which uses normal form tags, we'll be using mostly the editable-text component. When it's a new practice session, just fill the editable text with some placeholder text, and the user will need to update it.

Practice session templates will be a sortable editable list, with each item in the list being a practice session line item (two editable fields, title and display). You should be able to roughly base it off the DemoEditableList. Sometimes the text may get kind of long in a list item, this is ok and it's ok if individual list items are different heights from one another. It's probably best to make sure our drag handle stays at the top so it doesn't sit awkwardly in the middle of a long piece of text.

For editing, there is another big difference between practice session edits and the generator edits. In Generator edits, you have "save" and cancel. If you are editing a practice session, you just have "back", as edits happen automatically. New practice sessions will have a "save" and "cancel" button.

The edit practice session component will likely be used in other places, so let's make sure it's not too hard tied to the page. We also want to make sure it has a mode where you can only add/edit/delete the associated list items and the display, the unique name is hidden.


# Generator bug fixes
- [x] Fix dark mode on the select dropdown
- [x] Replace zod with typebox
- [x] Generator list currently has a selection box, and it shouldn't
- [x] Should have edit/delete buttons on hover.
- [x] Add pagination

# Generator CRUD
Because it has no dependencies, we're going to make the crud for generators first.

We haven't done CRUD yet in this application, so we'll be laying down some new patterns. We do have some nice supporting components, such as editable text, sortable lists, and a data table, which are all in addition to the baseline ShadCN components.

We will do integration with the backend once we have a clear idea of what the api should be, so create good API mocks in the api folder. We will hook it up to the backend in a different phase, but we also will always want testable code, so mocking will always be important. The mock API should be capable of returning a decent amount of data, so we may want to write a function for generating fake generators that will control the source of data the mock API pulls from. This will give us some powerful testing tools, both for unit tests but also for manual tests where we're experimenting with different configurations.

Existing generators should be shown in a searchable data table. When editing or creating a new generator, the form should be shown instead of the data table, but data table state should be maintained. When we edit a generator and return to the data table, we should see the updated values. The edited generator should still be focused when we return.

There should be something to click to bring up the "new generator" form. Once we create a new generator, we should make sure we refresh the data table view.

- Our data tables have the ability to have "focus" or "select". 
- We don't need to enable multi-select for generators. 
- For now we don't need to do any expansion
- We should be able to search generators
- We should be able to sort generators
- Don't use any pagination pre-fetching or caching, we won't have enough entities to make this matter
- A focused generated should respond to "e" being pressed by opening up the "edit" view for that generator. Check the data component and see if we need a more flexible way to add keybinds, as this will be a common pattern.
- If we don't have a way to disable all keybinds in the data table component, 

Deleting generators: We can't delete generators that are in use, so the steps for deleting generators are: 

1. Pop up "are you sure" confirmation
2. Try and delete (mock this call for now, putting the function in api/generators.ts). The api call should return either that we couldn't delete the row because it's being used, that it was successfully deleted, or that there was an unknown error.
3. Remove or hide the entity from the data table. We should get the impression that the row was "removed" rather than the page was refreshed.

Make sure to include testing for this component.