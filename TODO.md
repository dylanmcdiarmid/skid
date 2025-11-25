- [x] Copy client information from hcs
- [x] Integrate ultracite/biome
- [x] Add elysia
- [x] Add drizzle
- [x] Turn notes into schema
- [x] Remove drizzle, integrate kysely and kysely-codegen
- [ ] Create DAOs
- [ ] Integrate and test rspack

#  

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
