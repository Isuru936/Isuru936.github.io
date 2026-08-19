## ADDED Requirements

### Requirement: Environment configuration is validated at startup
The system SHALL validate all required environment variables against a schema when the application starts and MUST fail immediately with a message naming the missing or invalid variables.

#### Scenario: A required variable is absent
- **WHEN** the application starts without `TURSO_DATABASE_URL` or `TURSO_AUTH_TOKEN`
- **THEN** startup fails with an error naming the missing variables, rather than failing later at the first query

#### Scenario: All variables are present and valid
- **WHEN** the application starts with a complete, valid environment
- **THEN** configuration is exposed to the application as a typed object

### Requirement: Secrets are never committed to the repository
The system SHALL keep `TURSO_AUTH_TOKEN` and every other credential out of version control. `.env.local` MUST be git-ignored, and a `.env.example` listing key names without values MUST be committed.

#### Scenario: A developer clones the repository
- **WHEN** a fresh clone is inspected
- **THEN** `.env.example` documents every required key and no file contains a real credential

### Requirement: Continuous integration gates every pull request
The system SHALL run type checking, linting, and a production build on each pull request, and MUST fail the check when any step fails.

#### Scenario: A pull request introduces a type error
- **WHEN** a pull request is opened containing code that fails type checking
- **THEN** the CI check fails and the failing step is identified

#### Scenario: A pull request regresses performance budgets
- **WHEN** a pull request causes the measured performance budget to be exceeded
- **THEN** the CI check fails rather than allowing the regression to deploy

### Requirement: Database migrations are only ever run deliberately
The system SHALL expose migrations as a manually triggered workflow and MUST NOT run them automatically as part of a deployment.

#### Scenario: A deployment occurs
- **WHEN** a commit is pushed to the default branch and deployed
- **THEN** no migration is applied to the database as part of that deployment

#### Scenario: A migration is required
- **WHEN** an operator triggers the migration workflow manually
- **THEN** a database dump is captured before any migration statement is applied

### Requirement: Deployment is owned by the hosting platform
The system SHALL rely on the host's git integration to deploy on push to the default branch. GitHub Actions MUST be used for verification and manual operations only, not to perform deploys.

#### Scenario: A commit lands on the default branch
- **WHEN** a commit is pushed to the default branch
- **THEN** the host builds and deploys it, and no Actions workflow performs a deploy step
