# Architecture Guidelines

These guidelines describe a layered architecture for Next.js applications. Adapt
the physical directories to the project, but preserve the responsibilities and
dependency direction.

## Layer Responsibilities

- The application layer is the framework boundary for routing, pages, layouts,
  route handlers, server actions and other input adapters. It translates
  transport concerns and delegates work to application services or the
  Composition Root. It does not contain business rules or construct concrete
  infrastructure adapters directly.
- The application layer contains use cases, commands, queries, DTOs and ports.
  It coordinates workflows without depending on infrastructure, presentation,
  composition or framework APIs.
- The domain layer contains entities, value objects, invariants and pure
  business rules. It must not depend on application, infrastructure,
  presentation, composition, frameworks, UI libraries, filesystem APIs or
  external providers.
- The infrastructure layer contains concrete repositories, persistence
  adapters, external service integrations and framework-facing server
  adapters. It implements ports defined by the domain or application layers.
- The presentation layer contains UI components, presenters, view models and
  navigation-oriented presentation logic. It does not depend on infrastructure
  or the Composition Root.
- The Composition Root assembles application services with concrete
  infrastructure implementations. It may depend on application and
  infrastructure, but not on presentation or route entrypoints.

## Organization

- Organize related responsibilities by domain or subdomain within each layer.
- Keep routing and input adapters at the framework boundary instead of placing
  use cases or domain rules in route files.
- Keep route-specific collaborators close to their route when they have no
  valid reuse outside that route.
- Expose a public module API when a module has multiple consumers; consumers
  should not depend on implementation details.
- Do not create generic layers or folders merely for symmetry. Every directory
  must contain a concrete responsibility and a real consumer.

## Dependency Direction

- Dependencies point inward toward business policies and stable contracts.
- Domain code depends only on domain contracts and language primitives.
- Application code depends on domain code and ports, never on concrete
  providers or framework APIs.
- Infrastructure implements ports and may depend on external SDKs, the
  filesystem and framework server APIs where required by its adapter role.
- Presentation consumes application contracts and presentation models, never
  concrete infrastructure services.
- Composition wires application and infrastructure together and is not a
  replacement for either layer.
- Inversion of dependencies is mandatory: business logic depends on ports or
  interfaces, while concrete adapters depend on those contracts.

## Persistence

- Keep persistence details behind repositories or persistence adapters.
- Keep filesystem paths, serialization formats, locks, transactions and
  provider-specific errors inside infrastructure.
- Application services express persistence needs through ports rather than
  importing a database, JSON adapter or SDK.
- Preserve transaction, atomicity and rollback guarantees at the persistence
  boundary when the underlying operation requires them.
- Do not expose secrets, credentials or persistence-only records to client
  components.

## Server and Client Boundaries

- Keep server components as the default.
- Use client components only when state, event handlers, browser APIs or a
  client-only library is required.
- Client components must receive only the data and callbacks they need through
  serializable props.
- Client components must not import infrastructure, filesystem APIs, private
  configuration, server-only modules or persistence collections.
- Route entrypoints and server actions may use framework server APIs, but must
  delegate business behavior to application services assembled by composition.

## Architectural Verification

- Verify the dependency graph after structural changes; search for imports that
  cross a forbidden layer boundary.
- Verify that route files contain routing and input adaptation rather than
  business rules or concrete adapter construction.
- Verify that every concrete adapter implements a stable port and that the
  Composition Root is the only assembly point.
- Verify Server/Client boundaries, private configuration access and data
  projection before exposing a component to the browser.
- Verify that persistence data remains in its approved infrastructure boundary,
  that no accidental duplicate implementation exists, and that empty
  directories are not introduced.
