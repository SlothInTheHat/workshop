Workshop Voting & Executive Summary
Figma AI Design Spec
Overall Flow

Create a 3-tab workflow representing the lifecycle of a workshop:

Round 1 – Blind Voting
Round 2 – Voting Results
Executive Summary

Tabs should persist at the top across all screens.

Core Component: Idea Card

Create a reusable component:
Component name: Idea Card

Structure (top to bottom)
Title
Contributor Tag
Description
Footer (variant based on round)
Spacing
8px between title and contributor
8px between contributor and description
Subcomponent: Contributor Tag

Component name: Contributor Tag

Style
Background: #F3F4F6
Text: #374151
Font: 12px / Medium
Shape: Fully rounded pill
Left icon: user silhouette
Usage

This tag appears in all rounds and summary pages.

Round 1 – Blind Voting Screen

Frame name: Round 1 – Blind Voting

Layout
Grid of Idea Cards
Each card uses Idea Card / Voting variant
Card footer
Upvote button
Vote count hidden
Header
Title: “Blind Voting”
Optional helper text: “Vote on ideas without influence from others”
Round 2 – Voting Results Screen

Frame name: Round 2 – Voting Results

Layout

Same grid and card layout as Round 1 to preserve continuity.

Card variant

Idea Card / Results

Footer shows:

Final vote count
No upvote button
Banner

Top banner:
“Voting Results Revealed”

Executive Summary Screen

Frame name: Executive Summary

This screen is vertically structured and not card-grid based.

Section 1 – Workshop Summary

Frame: Executive Summary / Workshop Context

Contains:

Client Strategic Priorities
Workshop Objectives
Key Workflow Areas

Use a large padded panel container.

Section 2 – Top Opportunities

Frame: Executive Summary / Top Opportunities

Layout

Vertical list of ranked ideas.

Each row includes:

Rank number
Idea title
Contributor tag
Description
Highlight box: “Why It Matters”
Styling
Teal left border on each ranked item
Section 3 – Strategic Alignment

Frame: Executive Summary / Strategic Alignment

Display pillar tags:

Operational Efficiency
Patient Experience
Clinical Workflow Optimization
Data Interoperability

Use pill tag components.

Section 4 – Quick Implementation Opportunities

Frame: Executive Summary / Quick Wins

Each row includes:

Idea name
Suggested Optura agent
Difficulty badge
Difficulty badge variants
Low – Green
Medium – Yellow
High – Red
Section 5 – Value vs. Viability Chart

Frame: Executive Summary / Value vs Viability

2×2 quadrant chart:

X-axis: Implementation Viability
Y-axis: Business Value

Ideas appear as labeled dots with hover tooltips.

Global Action

Place in top-right of Executive Summary:

Primary Button:
“Download Executive Report”

Component Variants to Generate

Figma AI should create variants for:

Idea Card
Voting
Results
Summary (no footer)
Tags
Contributor Tag
Strategic Pill Tag
Difficulty Badge (3 variants)
Explicitly Excluded UI

Do not generate:

Scoring grids
Numeric scoring columns
AI composite scores
Executive weighting controls
Role-based view toggles