## ADDED Requirements

### Requirement: MDX files are the source of truth for project content
The system SHALL read project and case-study content from MDX files under `content/`. Project content MUST NOT be stored in the database.

#### Scenario: A new project is added
- **WHEN** an author commits `content/projects/<slug>.mdx` with valid frontmatter
- **THEN** a page is generated at `/work/<slug>` and the project appears in the `/work` index on the next build

#### Scenario: Content is requested at runtime
- **WHEN** a visitor loads any project page
- **THEN** the response is served from statically generated output and no database query is issued

### Requirement: Frontmatter is validated at build time
The system SHALL validate every content file's frontmatter against a schema and MUST fail the build on invalid or missing fields rather than rendering a partial page.

#### Scenario: Required frontmatter field is missing
- **WHEN** a project MDX file omits a required field such as `title` or `year`
- **THEN** the build fails with an error naming the offending file and field

#### Scenario: Frontmatter is well-formed
- **WHEN** all content files satisfy the schema
- **THEN** the build succeeds and content is exposed to pages as typed objects

### Requirement: Project routes are statically enumerated
The system SHALL derive the set of project routes from `content/` via `generateStaticParams`.

#### Scenario: An unknown project slug is requested
- **WHEN** a visitor requests `/work/<slug>` for a slug with no corresponding MDX file
- **THEN** the system returns a 404 response
