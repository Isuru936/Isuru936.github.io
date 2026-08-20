## ADDED Requirements

### Requirement: WebGL code is confined to a single boundary
The system SHALL restrict all imports of `three` to `src/three/`. No other directory MUST import it.

#### Scenario: WebGL is imported outside the boundary
- **WHEN** a module outside `src/three/` imports `three`
- **THEN** the lint step fails with an error identifying the offending import

#### Scenario: A text-only route is loaded
- **WHEN** a visitor loads a route that renders no 3D scene
- **THEN** no three.js code is included in the JavaScript delivered for that route

### Requirement: Scenes mount client-side only and never in the root layout
The system SHALL load every scene entry point via `dynamic(..., { ssr: false })` and MUST NOT mount a `<Canvas>` in `app/layout.tsx`.

#### Scenario: A page containing a scene is server-rendered
- **WHEN** a page with a 3D scene is requested
- **THEN** the server-rendered HTML contains the poster fallback and no WebGL initialisation

#### Scenario: Navigating away from a scene
- **WHEN** a visitor client-side navigates from a page with a scene to one without
- **THEN** the WebGL context and its GPU resources are released and no additional context is retained

### Requirement: A non-WebGL fallback is always available
The system SHALL render a static poster image as the initial visual and MUST keep the page usable when WebGL is unavailable or the visitor prefers reduced motion.

#### Scenario: WebGL is unsupported
- **WHEN** a visitor's browser cannot create a WebGL context
- **THEN** the poster image remains visible and all page content and navigation stay usable

#### Scenario: Visitor prefers reduced motion
- **WHEN** `prefers-reduced-motion: reduce` is set
- **THEN** the scene suppresses ambient and autoplaying motion while remaining visible

#### Scenario: The scene finishes loading
- **WHEN** scene assets have loaded on a capable device
- **THEN** the canvas becomes visible over the poster and the poster is not the Largest Contentful Paint regression point

### Requirement: Rendering cost adapts to the device
The system SHALL cap device pixel ratio and select a quality tier appropriate to the device rather than rendering at unbounded resolution.

#### Scenario: A low-powered mobile device loads the scene
- **WHEN** the scene mounts on a device reporting limited capability
- **THEN** a reduced quality tier and a capped pixel ratio are applied
