The current sidebar is from an old application, let's update it to our new app, with the following layout.

┌─────────────────────────┐
│  Skid                   │
├─────────────────────────┤
│  ★ Today                │  ← Primary CTA, visually prominent
│  Planning               │
│  History                │
├─────────────────────────┤
│  TEMPLATES              │  ← Section label, muted
│  Day Templates          │
│  Practice Sessions      │
│  Generators             │
├─────────────────────────┤
│  INSIGHTS               │  ← Section label, muted
│  Generator History      │
├─────────────────────────┤
│  ⚙ Settings             │  ← Bottom of sidebar
└─────────────────────────┘

Rationale
Top Section (Daily Actions)

Today – The primary entry point. Goes to Day View (Unstarted or Instance Started depending on state). Should be visually distinct (bold, icon, or accent color).
Planning – Frequently accessed for quick capture and review.
History – Common enough to warrant top-level access; users will check yesterday or recent days often.

Templates Section

Day Templates – Links to the Day Template List View.
Practice Sessions – Links to a list view of Practice Session Templates (we didn't explicitly spec this, but it's implied—users need a way to browse/edit sessions outside of the day template context).
Generators – Links to Generator Management.

Insights Section

Generator History – The only analytics view for now. Section exists to accommodate future stats views (practice time, completion rates, etc.).

Settings

Anchored at the bottom, following common UI patterns.

Let's update the sidebar, and then also update the routes so we have valid routes available. Create a new placeholder page for anything we don't have (check pages/ folder).