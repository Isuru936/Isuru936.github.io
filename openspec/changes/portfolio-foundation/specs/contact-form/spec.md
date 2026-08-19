## ADDED Requirements

### Requirement: Contact submissions are validated then persisted
The system SHALL validate every submission on the server before writing it, and MUST reject submissions failing validation without creating a row.

#### Scenario: A valid submission
- **WHEN** a visitor submits a name, a well-formed email address, and a message within length limits
- **THEN** the submission is stored and the visitor receives a confirmation stating the message was sent

#### Scenario: An invalid submission
- **WHEN** a visitor submits a malformed email or an empty message
- **THEN** no row is written and the form reports which field needs correcting

#### Scenario: Client-side validation is bypassed
- **WHEN** a request is posted directly to the action without passing browser validation
- **THEN** server-side validation still rejects it

### Requirement: The submission endpoint is protected against automated abuse
The system SHALL rate-limit submissions and MUST include a honeypot or CAPTCHA challenge. This protection is a condition of shipping the form, not a follow-up.

#### Scenario: Submissions exceed the rate limit
- **WHEN** a single origin submits more times than the configured threshold within the configured window
- **THEN** further submissions are rejected without a database write

#### Scenario: A bot completes the honeypot field
- **WHEN** a submission arrives with the honeypot field populated
- **THEN** the submission is discarded without a database write and without a validation error revealing the mechanism

### Requirement: Submitter identity is stored without retaining raw IP addresses
The system SHALL store a hashed representation of the submitter's IP address for abuse handling and MUST NOT persist the raw address.

#### Scenario: A submission is recorded
- **WHEN** a valid submission is stored
- **THEN** the row contains a hashed IP value and no plaintext IP address
