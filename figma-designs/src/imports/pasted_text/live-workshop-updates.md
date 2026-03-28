Update Live Workshop Mode

Modify the Live Workshop interface while preserving the current layout, AI Analyst panel, agenda panel, and use case cards.

Do not redesign the page structure. Only implement the requested collaboration and terminology updates.

1. Remove "Show All" from My View

In the top toolbar where the view controls exist:

Current layout:

My View | Workshop View | Show Mine | Show All

Update to:

My View | Workshop View | Show Mine

Remove the Show All toggle completely.

The intent is to simplify filtering so participants only toggle between:

• their personal view
• the workshop view
• showing only their own ideas

Maintain the current styling and spacing so the UI still looks balanced.

2. Replace Impact & Feasibility with Value & Viability

Update the terminology across the entire Live Workshop interface.

Replace:

Impact → Value
Feasibility → Viability

Apply this change consistently in:

• Use case cards
• AI structured preview panel
• Tag labels
• AI generated summaries
• Insight cards

Example:

Old tags:
Impact: High
Feasibility: Medium

New tags:
Value: High
Viability: Medium

Maintain the same tag colors and styles so only the wording changes.

3. Add Breakout Team Collaboration Support

Workshop participants may split into breakout teams to ideate use cases. Add a lightweight collaboration mechanism without cluttering the screen.

Breakout Team Indicator

Add a team label badge to each use case card.

Example badge placement:

Under the title or next to contributor name.

Badge examples:

Team A
Team B
Clinical Ops Team
Data Team

Style:
Small pill badge similar to contributor tag styling.

Team Filter

Add a new dropdown filter in the top toolbar:

Team Filter

Options example:

All Teams
Team A
Team B
Clinical Ops
Data Team

Selecting a team filters the canvas to show only ideas created by that breakout group.

Team Presence Indicator

Under the Participants panel, add a new subsection:

Breakout Teams

Example display:

Team A
• Dr. Sarah Chen
• Jamie Liu

Team B
• Michael Torres

This visually shows who is working in each breakout group.

Optional Team Workspace Indicator

Above the ideation canvas, add a subtle label:

Currently Viewing: Team A Workspace

This reinforces collaboration context during breakout sessions.

4. Maintain AI Analyst Workflow

Do not change the right-side AI Analyst panel.

AI should continue to:

• cluster ideas
• detect similarity
• suggest structured previews
• help convert ideas into use case cards

The AI panel should work seamlessly with breakout teams.

Example enhancement:

AI can optionally detect patterns within each team’s ideas.

5. Preserve the Core Workshop Layout

Do not change these existing elements:

Agenda sidebar
Participants panel
Use case cards
Canvas layout
AI Analyst panel
Add Usecase button
Insight cards

The goal is to enhance collaboration while keeping the interface familiar.

Final Result

The updated Live Workshop interface should:

• support breakout team ideation
• simplify the view filters
• align terminology with Value and Viability
• maintain a clean real-time collaboration environment