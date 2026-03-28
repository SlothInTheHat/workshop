Goal:
Refactor the current Workshop Mode (Live Workshop) screen to:

Support breakout team collaboration
Improve clarity of ownership and interaction
Remove redundant controls
Maintain AI-assisted workflow
Make the experience feel live, collaborative, and dynamic
🧱 1. TOP NAVIGATION — SIMPLIFY VIEW CONTROLS
❌ REMOVE:
“Show Mine” toggle
Redundant filtering controls
✅ REPLACE WITH:

Create a single unified view selector (top center of screen):

View: [ Mine ▼ ]

Dropdown options:

Mine
Team A
Team B
All Teams

👉 Style:

Rounded dropdown
Light grey background (#F5F5F5)
Selected state = subtle green or purple accent
👥 2. LEFT SIDEBAR — ENHANCE TEAM COLLABORATION
KEEP:
Agenda section
Participants section
🔥 UPDATE “Breakout Teams” SECTION:

Each team block should include:

Team A
• Dr. Sarah Chen (green dot)
• Jamie Liu (purple dot)

Status: ● 2 Active

👉 Add:

Colored presence indicators (live feel)
“Active collaborators” count
🧩 3. MAIN CANVAS — TEAM WORKSPACE (MAJOR CHANGE)
🔥 ADD HEADER ABOVE CARDS:
Team A Workspace
Active collaborators: Sarah, Jamie
[ + Add Use Case ]

👉 This replaces the floating button

❌ REMOVE:
Floating “+ Add Usecase” button at bottom center
✅ CREATE CARD STRUCTURE (UPDATED):

Each use case card should include:

🧾 CARD CONTENT:

Top row:

[ Team A badge ]     [ AI icon ]

Title:

Intake form duplication

Description:

Multiple manual re-entry points across EHR systems
🔥 ADD COLLABORATION LAYER:

Under description:

👤 Sarah Chen   👤 Jamie Liu

OR:

2 collaborators active
🔥 VALUE TAGS (UPDATED TERMINOLOGY):
Value: High   |   Viability: Medium   |   Internal
🔥 CROSS-TEAM SIGNAL (NEW):

If applicable, add badge:

Cross-team overlap detected (Team B)

👉 Style:

Light purple tag
Subtle, not dominant
FOOTER:
↑ 3    💬 2    2m ago
🤖 4. AI ANALYST PANEL — MAKE IT FEEL CONNECTED
KEEP STRUCTURE but ADD:
🔥 DYNAMIC HEADER:
Analyzing Team A workspace...
🔥 CONTEXT LINKING:

When a card is selected:

Based on Sarah’s use case:
"We’re seeing duplicate intake entries..."
KEEP:
Chat interface
Structured preview box
🧠 5. STRUCTURED PREVIEW CARD (RIGHT PANEL)
UPDATE LABELS:

Replace:

Impact → Value
Feasibility → Viability
FINAL STRUCTURE:
TITLE
Intake Form Duplication

SUMMARY
Manual re-entry across EHR systems

VALUE      VIABILITY
High       Medium

Similarity: 87% to "EHR Data Sync Delays"

Buttons:

[ Create Use Case Card ]   [ Refine ]
🔄 6. CROSS-TEAM VISIBILITY (IMPORTANT ADD)

Add subtle system-level awareness:

OPTION A (lightweight):

Top of workspace:

2 similar ideas exist across other teams
OPTION B (better):

On individual cards:

Also seen in Team B
🎯 7. FINAL UX GOALS (DO NOT SKIP)

Ensure the design clearly communicates:

✅ This is a team-based collaborative environment
✅ Users can see who is working on what
✅ AI is embedded, not separate
✅ Ideas are not siloed across teams
✅ Creating a use case feels contextual and natural

🎨 STYLE GUIDELINES
Maintain Optura palette (purple + neutral greys)
Keep soft shadows + rounded cards
Use subtle motion indicators (dots, timestamps)
Avoid clutter — prioritize clarity over density
🚀 WHAT THIS FIXES (tie back to feedback)

✔ Breakout collaboration → visible + real
✔ Redundant controls → removed
✔ Add use case → contextualized
✔ Terminology → consistent
✔ Cross-team awareness → added
✔ AI → feels integrated, not bolted on

🧠 Final Note

This version will feel like:
👉 “a real collaborative product” instead of a static wireframe