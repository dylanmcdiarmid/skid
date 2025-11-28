# Practice Session add/edit screen
The edit screen is almost there, but we need a few updates to make it perfect. Right now we're showing a "Line Items" heading. We're going to condense this a bit. 

- The unique name will now be the only thing in General Information
- Instead of announcing Line Items, we're going to show the display name of the template, and it will be editable in place.
- Beneath it we'll show "53" minutes (or whatever the recommended time is), with 53 being editable. When clicking either the 53, or the time "word" information, we will edit the time. We should be able to put in a human duration, and have it translated into the underlying minute integer. For example if we input "2 hours 15 minutes", it should set the underlying field to 135. But when it's displayed, it should show "2 hours and 15 minutes" or whatever is easiest with humanize-duration. If we need to update the editable-text component to make this easier, then do it. We should use the humanize-duration package to help us with this.
- Other than unique name, and the minutes suffix, we're going to remove labels. The formatting should be enough for the user to feel where they're at.


# TODO definite
- [ ] Editable text Take up full available width, with an optional max width, and try to be smart about height
 
# TODO maybe
- [ ] "Refresh" button for the data table
- [ ] There is maybe some weird sorting behavior when clicking columns a few times, they stop toggling sometimes?
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