- [x] Copy client information from hcs
- [x] Integrate ultracite/biome
- [x] Add elysia
- [x] Add drizzle
- [x] Turn notes into schema
- [x] Remove drizzle, integrate kysely and kysely-codegen
- [ ] Create DAOs
- [ ] Integrate and test rspack

# Plan for mocking the front end

We've created our database schema, now I'd like to get started on the other end and get the frontend going. We'll be using React and ShadCN. Our design style should be minimal and utilitarian, optimized for a regular daily user. Let's spec out what the major views should be for the app.

## Day Template List View

Paginated table that lists all existing day templates. By default it is only active day templates, but we should be able to also browse deactivated if we wish.

There should be a button to add a new Day Template.

## Day Template Add/Edit View

Day Templates are made out of practice session templates. We should be able to create a practice session template on the fly (in a popover), or select an existing practice session template. For any practice session template we add, we should be able to override its recommended time in minutes here. We should also be able to re-order practice sessions within the template.

## Practice Session Template Add/Edit

We should be able to easily add line items in a text box. Posting multiple lines should add multiple line items. We should also be able to remove existing line items, or edit them. We should have a handle for dragging and re-ordering template items.

We should be able to add or remove generator from any practice session template. To add, choose the generator name from a dropdown, fill in quantity and label. Any existing generator associated with this session should be able to be removed, or re-ordered.

Unique name should be editable and required.

Practice Session Templates will also have an option to set the default recommended time

This component should be able to be loaded in a popover when accessed from the Day Template Add/Edit View.

## Day View: Unstarted

If we have no active day templates created, this will redirect to the Day Templates page. Otherwise it's also the default landing page. If we have an instance started for the day already, we'll redirect to that. For this version, we can't plan or start future days.

Should have a searchable dropdown for selecting a day template, along with the most recent 3 day templates clickable. Either clicking one of the most recent 3, or selecting one from the dropdown, will trigger the creation of new day instance based on the day template.

## Day View: Instance Started

If the day has an instance associated with it, they will see this view.

### Subview: Generators

Any generators associated with this instance should be at the top. A generator can either be in the "un-run" state, or the "run" state. If it's in the run state, it should show the value, and the practice session it's associated with, along with an option to undo it.

We will have some cases where we re-use an already generated value for all places it's appropriate (for example, we might generate 3 chord progressions, and every practice session that needs chord progressions gets those). If we detect there are generators that are eligible to receive values, generators in the "run" state will also have a "Share Values" button that will share out the values they already generated. Any other un-run generator with the same generator_id is eligible, as long as the quantity is less than or equal to (so if we generated 2 values, and shared it, we would set quantity 1 value automatically, but a quantity 3 value would have nothing shared automatically, the user would set that up manually)

Any generated value can be "unrun", and it will revert to its ungenerated state.

Un-run generators can be "run" to have the value auto-generated or have a "manual" entry which should prompt the user to fill in values for each quantity (for example, quantity 3 the user should have 3 text boxes to fill in). Un-run generators will show the name of the generator and which session it's associated with, as well as its quantity.

Generated values will autopopulate in the correct place in the practice session instance line items once they've been associated. Otherwise we'll see the associated template string of uppercased generator name and quantity, e.g. KEY#1, KEY#2. It should display with a yellow or orange background if it hasn't been filled in, otherwise it can be a light green background just to show it has been generated.

### Subview: Practice Session

Each practice session can be edited on page. Line items can be removed or added easily. Notes can be easily edited and appended. Each practice session should be able to "replace" its corresponding template, having the new values override the template values. This will be fairly common practice, and should be an easy to find button next to each practice session that has been edited. Line items should be able to be re-ordered, and line items should be able to be removed. Clarification: "Actual" time should not replace anything in template, only replace time if we edited "recommended_time_minutes". Replacing means overwriting the associated practice_session_template (destructive). Practice session templates aren't particularly sacrosanct to users, they are expected to mutate all the time and the complexity of dealing with lots of different templates is a much worse option.

We should be able to set the actual time for the practice session, and mark the session as either completed or canceled.

For the sake of concentration, we should be able to have a "distract-free" zoom into an Practice Session, where we just see the practice session (with all edit features intact), but with larger text and getting rid of all other page elements, other than something that lets us easily exit "distract-free" mode.

## Planning View

Planning view shows all uncompleted and unrejected items. Each line item should let you complete or reject it. You should also be able to easily add new line items in this view, or drag to reorganize. We should also have a button to "snooze" an item for a day. For now we just want to see the list, we don't need any special "send-to" controls.

## Day History

Should show clickable links to the past 7 days, as well as let you enter any date. These pages should be the same as the current day view (including being still editable). The only difference is if they are from a previous day, they should announce that in eye-catching header at the top of the page.

## Generator History View

The Generator History view provides a visual overview of generated values over time, helping users identify patterns, spot repetition, and ensure balanced coverage of their practice material (e.g., "Am I neglecting certain keys?").

### Layout

The page is organized by **Generator** (e.g., "Random Keys", "Chord Progressions"). Each generator that has at least one value generated within the selected time range gets its own section with a header and table.

### Date Range Controls

At the top of the page:
- **Range Selector:** A date range picker defaulting to the last 14 days (today minus 13 days through today).
- **Quick Presets:** Buttons for "Last 7 days", "Last 14 days", "Last 30 days", "This month", "Last month".
- The range can be any length, but only 14 days display at a time per table (see Pagination below).

### Generator Tables

Each generator section contains:

**Header Row:**
- Generator name (e.g., "Random Keys")
- Generator strategy in muted text (e.g., "Least Recently Used")
- Total unique values generated in range / total possible values if known (e.g., "8/12 keys covered")

**Table Structure:**

| Practice Session | Nov 25 | Nov 24 | Nov 23 | ... | Nov 12 |
|------------------|--------|--------|--------|-----|--------|
| Piano - Scales   | C, F#  | Bb, E  | C, G   | ... | D, A   |
| Piano - Arpeggios| C, F#  | Bb, E  | —      | ... | D, A   |
| Guitar - Warmup  | G      | —      | C      | ... | —      |

- **Row headers:** Practice Session Template display name. If a generator was used by multiple sessions on the same day, each session gets its own row.
- **Column headers:** Dates in descending order (most recent on left). Dates with no day instance created should show as a dimmed column with "—" in all cells.
- **Cells:** Comma-separated list of generated values for that session on that day. Empty cells (session existed but generator wasn't run for it) show "—".

### Value Color Coding

To help users visually identify repetition and distribution:

- Each unique value within a generator's table receives a consistent background color.
- Colors are assigned dynamically based on frequency (most frequent values get the most visually distinct colors).
- A small legend appears below each table showing value → color mappings, sorted by frequency descending.
- Color palette should be accessible (distinguishable for colorblind users). Consider using both color and a subtle pattern or border variation.
- If there are more unique values than available colors (e.g., >12), less frequent values can share a neutral "other" color, grouped in the legend as "Other: E, F, F#...".

### Pagination

- Each generator table is paginated independently.
- Maximum 14 date columns visible at once.
- Pagination controls (← Older | Newer →) appear below each table.
- Current page indicator: "Showing Nov 12–25 of Nov 1–25" (for a 25-day selected range).
- If a generator has no data in the current 14-day page window but does have data elsewhere in the range, show a message: "No values in this date range. [Jump to most recent →]".

### Empty States

- **No generators exist:** "No generators have been created yet. [Go to Generator Management →]"
- **No history in range:** "No values were generated between [date] and [date]. Try expanding your date range."

### Interactions

- Clicking a cell could navigate to that day's Day View, scrolled to the relevant practice session.
- Clicking a practice session row header could navigate to that Practice Session Template's edit view.
- Clicking a value (e.g., "C") could highlight all cells containing that value across all tables on the page.

## App Configuration View

A minimal settings page for app-wide preferences. Accessible from the main navigation menu.

### Sections

**Display Preferences**
- **Theme:** Light / Dark / System (toggle or dropdown)
- **Start of Week:** Sunday / Monday (affects any weekly views or statistics)
- **Date Format:** ISO (2025-01-15) / US (01/15/2025) / EU (15/01/2025)
- **Time Format:** 12-hour / 24-hour

**Practice Defaults**
- **Default Session Duration:** Number input (minutes). Used when creating new Practice Session Templates if no duration is specified. Default: 30.
- **Default Day Template:** Dropdown of active day templates. If set, the "Day View: Unstarted" page will pre-select this template. Default: None (user must choose).

**Generator Settings**
- **History Lookback for LRU:** Number input (days). For "Least Recently Used" strategy, how far back should the algorithm look? Default: 30 days.
- **Allow Duplicate Generation:** Toggle. If off, generators will never produce the same value twice in a single day across all sessions. Default: Off.

**Quick Entry (Ctrl+Space)**
- **Default Quick Entry Mode:** Planning Item / Session Note / Day Note. What the quick entry popover defaults to when opened. Default: Planning Item.
- **Show Quick Entry Hint:** Toggle. Show a subtle "Ctrl+Space" hint in the corner of the app. Default: On (can be dismissed permanently).

**Data Management**
- **Export Data:** Button to download a full JSON export of all data (templates, instances, planning items, history).
- **Import Data:** Button to upload a previously exported JSON file (with merge/replace options).
- **Clear History:** Button to delete all day instances, practice session instances, and generator history older than X days. Requires confirmation. Templates and planning items are preserved.




## Overall components

We should have an unobtrusive menu at the top that allows navigating to any of the main views. Re-order in list and click to remove icon or button should be standardized, as they are used in multiple places. Most of these places are also places where we'll be adding multiple sub-entities (for example generators to a practice session or list items to a practice session). A standard component for larger searchable, filterable lists that have pagination should also be used where appropriate.

Ctrl+Space should bring up a "quick entry" popover. By default this should let the user enter a new item to send to planning.

---

# Notes on Generator History Page

Please write up a description for a "Generator History" page. It should cover a span of time (by default last 14 days), and include any generator that had a value generated and associated with a practice session instance in that team.

Each generator view should be a table, with the column headers being dates descending, and the row headers being the name of Practice Session generators had values assigned for. Then the cells of the table are the values that were generated on that day for that practice session. Values that are the same should receive the same background color, (so if "C" is in 3 places in might have a green background, then "D" is in 2 places with a blue background in each, and "D#" in one place with a red background).

We should be able to set a range, but we should only show a maximum of 14 days at a time, the rest would be paginated. Each table is paginated individually.

Also go ahead and write up a short description of the app configuration page, just something to get us started with based on what you know about the app.

# Notes into schema

I'm building a schema for an app that I can use to generate a practice schedule for the day. "Practice" here will usually mean a music practice session, but will likely expand to mean things like "workout" session as well, or even chores and routines like "cleaning".

When we generate a "sheet" for the day, we'll select a "day template". The day template will link to a set of practice session templates, which will link to practice session line items. Here's an example.

- Piano - 1 hour
  - Play Hanon exercise 1 at 120 bpm
  - Play Hanon exercise 4 at 120 bpm
  - Chords and inversions in today's selected keys
  - Moonlight Sonata focus on increasing arpeggio speed
  - Jazz Improv to backing track
- Guitar - 30 minutes
  - Chromatic exercise at 80 bpm
  - Fingerpicking practice at 100 bpm on chosen chord progression
  - Improv to backing track
- Weightlifting: 45 minutes
  - Do scheduled workout for day of week

As you can see, sometimes the list items will be detailed, sometimes they will be simple and mainly be there so the user can add notes and see where their time went.

Once a day has been generated, everything turns into an "instance", and it can be freely edited. Notes can be taken for that instance as well.

The planning screen can be visited at any time. The idea is that when things occur to the user during a practice session, they can get it out of their brain quickly by sending it to planning.

"display" usually refers to what text will be displayed for the item
id should be a uuid

- practice_session_templates
  - id
  - unique_name
  - display
  - disabled_at
  - created_at
- practice_session_line_items
  - id
  - practice_session_template_id
  - display
  - created_at
- practice_session_instances
  - id
  - display
  - recommended_time_spent_in_minutes
  - actual_time_spent_in_minutes
  - practice_session_template_id
  - day_instance_id
  - created_at
  - canceled_at
- practice_session_instance_line_items
  - id
  - practice_session_line_item_id : just an audit trail, once this becomes an instance it can have everything changed about it
  - practice_session_instance_id
  - display
  - completed_at
- practice_session_instance_notes
  - id
  - practice_session_instance_id
  - display
  - notes
- day_instances
  - id: unlike the others, this is not a uuid but a standard ISO ordered date, e.g. "2025-11-25"
- day_templates: Day templates are a unique collection of practice session templates. The practice session template and its children can change and still remain associated with the same day template.
  - id
  - display
  - created_at
  - disabled_at
- day_template_to_practice_session_template
  - id
  - day_template_id
  - practice_session_template_id
  - recommended_time_in_minutes : How much time the session should take
- planning_items: The user can create a planning item at any time. Planning items are meant to allow the user to quickly get an idea jotted down, and go back to their practice session. Later these items will be processed, and can either be disabled or completed (will only show again if looking at history of all planning items)
  - display
  - min_day_year: null by default, but if filled we don't show these items unless our day_instance id is equal to this day year. This let's us "kick" an item so it doesn't show in our planning view until later
  - created_at
  - completed_at
  - disabled_at

# What does the planning tool look like?

Upload "day templates", toml files that describe what the day should look like
Click to generate the day
Visit a day
Mark off an item as we practice
Take a note for the instance
Send a message to planning for the next time planning comes up
"Reclaim" time, move into an existing block or into the "unscheduled" block
zoom in and out from an instance
Add a one off item to an instance
Each instance will have a "main" schedule, but can also have "alternate" schedules (with unique names)
Start a "free" day, where sessions can be added

## Planning Feature

Just a list of stuff that's been deferred from previous sessions
Defer to next planning
Complete and mark as integrated
Complete and remove

# Example Plan

## Study/Musicality

Transcribing: 0.5 hours
Composing/Sound Design: 0.5 hours
"Free Session": 0.5 hours
Free session can be allocated to another existing activity we'd like new time on, a new plugin, or other

## Mechanical drills w/some song work

Voice/Singing: 0.75 hours
Voice/Speaking: 0.5 hours
Guitar: 0.75 hours
Keyboard: 0.5 hours
Drum: 0.5 hours
Bass: 0.5 hours

## Planning/Revising

10 minutes before evening practice

- Decide if we're stealing or gaining time from anything.
- Look over practice plan and note if we're missing anything
  20 minutes
- Research any missing drills
  Purpose is to make sure the rest of the time is focused

# Flexibilty

If we are behind schedule, we can reclaim Drum and Bass time first.

Commit to a schedule
