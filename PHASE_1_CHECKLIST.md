# Phase 1 Checklist

## Goal

Establish a private, working web application foundation that can be opened and tested locally in a browser.

Phase 1 is not the collection intelligence system yet. It is the visible, testable shell that proves the application can support private access, role-based views, and later development.

## Phase 1 Scope

Build only:

1. local app setup
2. login screen
3. logout
4. role-based demo users
5. dashboard shell after login
6. separate visible dashboard views for each role
7. placeholder navigation pages
8. clear local testing instructions

## Required Demo Roles

The app must include mock/demo users for:

- Student
- Professor
- Librarian
- Collection-Area Librarian
- Head Librarian
- Administrator

Each role must have a visible label after login so the tester can confirm which role is active.

## Required Placeholder Areas

The dashboard shell must include navigation placeholders for:

- Collection
- Recommendations
- Analytics
- Title Genealogies
- Market Alerts
- Evidence Review
- Admin or System Settings

Unbuilt areas must be clearly marked as placeholders.

## Role-Specific Dashboard Expectations

### Student
Should see exploration and recommendation placeholders only.

### Professor
Should see course/program recommendation placeholders.

### Librarian
Should see collection review and evidence review placeholders.

### Collection-Area Librarian
Should see assigned collection-area activity placeholders.

### Head Librarian
Should see analytics, targets, approvals, and decision queue placeholders.

### Administrator
Should see user and system-management placeholders.

## Privacy and Access Rules

- No dashboard page should be accessible before login.
- Logout must return the user to the login screen.
- Demo authentication is acceptable in Phase 1.
- Real authentication, password reset, institutional single sign-on, and production security can wait until a later phase.

## UI Requirements

- clean
- readable
- mobile-aware
- plain language
- obvious navigation
- obvious placeholder labeling
- no decorative complexity
- no unnecessary animation

## Local Setup Requirements

Codex must provide:

1. install instructions
2. run command
3. local URL
4. demo login credentials
5. what to test
6. known limitations

## Must NOT Include

Phase 1 must not include:

- catalog import
- AI enrichment
- market search
- recommendation engine
- real analytics calculations
- purchasing workflows
- evidence-review logic
- real collection data
- external APIs
- production deployment

## Acceptance Criteria

Phase 1 is complete when:

- the app runs locally without errors
- the tester can open it in a browser
- the tester sees a login screen
- each demo user can log in
- each role sees a distinct dashboard view or role-specific content
- users can log out
- protected pages cannot be reached without login
- all placeholder navigation links work
- unfinished features are clearly labeled as placeholders
- setup and testing instructions are documented
- no features beyond Phase 1 scope have been added

## Manual Test Checklist

### Login

- Open the local app URL.
- Confirm the login screen appears.
- Log in as each demo role.
- Confirm the role label changes correctly.
- Log out.

### Role Views

- Confirm Student sees recommendation/search placeholders.
- Confirm Professor sees course/program recommendation placeholders.
- Confirm Librarian sees review placeholders.
- Confirm Collection-Area Librarian sees collection-area placeholders.
- Confirm Head Librarian sees analytics/approval placeholders.
- Confirm Administrator sees user/system placeholders.

### Navigation

- Click every navigation link.
- Confirm no broken routes.
- Confirm unfinished areas are labeled as placeholders.

### Privacy

- Try to access a dashboard URL while logged out.
- Confirm the app redirects to login or blocks access.

### Usability

- Confirm the interface is readable.
- Confirm labels are understandable to nontechnical users.
- Confirm the interface does not imply unfinished features are functional.
