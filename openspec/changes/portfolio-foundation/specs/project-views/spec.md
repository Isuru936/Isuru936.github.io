## ADDED Requirements

### Requirement: Project views are counted durably
The system SHALL record a view count per project slug in the database and MUST persist counts across deployments and cold starts.

#### Scenario: First view of a project
- **WHEN** a visitor loads a project page that has no existing count row
- **THEN** a row is created for that slug with a count of 1

#### Scenario: Subsequent view of a project
- **WHEN** a visitor loads a project page that already has a count row
- **THEN** the stored count for that slug is incremented

### Requirement: View counting never blocks or breaks rendering
The system SHALL treat the view count as eventually consistent and MUST render the page successfully when the database is unreachable.

#### Scenario: The database is unavailable
- **WHEN** a project page is requested and the database cannot be reached
- **THEN** the page renders in full and the failure is logged without being surfaced to the visitor

#### Scenario: A page render is in progress
- **WHEN** a view is recorded
- **THEN** the increment does not delay the page's response

### Requirement: Repeat views within a session are not double-counted
The system SHALL deduplicate increments for the same visitor and project within a single session to protect the database write allowance.

#### Scenario: A visitor reloads the same project page
- **WHEN** the same visitor loads a project page repeatedly within one session
- **THEN** at most one increment is written for that project in that session
