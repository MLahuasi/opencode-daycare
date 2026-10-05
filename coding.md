# Coding Guidelines

These guidelines describe implementation conventions for reusable Next.js and
TypeScript code.

## General Code

- Use English for code and file names.
- Keep responsibilities clear, coupling low and abstractions justified by real
  reuse or a concrete requirement.
- Separate presentation, data access, validation, state and business logic when
  combining them would reduce clarity.
- Do not add compatibility code, handlers, links, navigation or behavior that
  the surrounding contract does not require.
- Keep comments concise and reserve them for non-obvious decisions or logic.
- Use `//` only for decisions or logic that is not evident from the code.

## Documentation

- Exported APIs and reusable components must have JSDoc.
- Function JSDoc includes a description, `@param` for every parameter,
  documentation for each own prop received by a component, and `@returns`.
- If props extend native HTML attributes, document that relationship.

## TypeScript

- Preserve strict typing and prefer domain or application contracts over
  duplicated structural types.
- Keep types close to the responsibility that owns them and expose them from a
  public barrel only when they are part of that module's public API.
- Use `Omit` to resolve conflicts between native element attributes and custom
  props.
- Avoid weakening types with broad casts, implicit `any` or unchecked values.

## Imports and Module APIs

- Import reusable modules through their public barrel when one exists.
- Avoid deep imports into another module's implementation files.
- Keep private route collaborators private to their route boundary.
- Use path aliases consistently and do not mix equivalent physical and aliased
  import styles without a concrete reason.

## React

- Keep components presentational: receive data, destinations, variants and
  configurable event targets through props instead of inventing application
  behavior.
- Reusable components must accept and merge `className?: string` when styling
  composition is relevant.
- Reusable components should extend the native attributes of the element they
  render when that is part of their public API.
- Keep component-specific props next to the component; export their types only
  when consumers need them.
- Keep reusable UI free of mock data, business rules and domain models.
- Keep Server Components by default. Add `"use client"` only for state, event
  handlers, browser APIs or client-only dependencies.
- Interactive elements should expose applicable hover, focus-visible, disabled,
  loading and pointer affordances.

## Data and Configuration

- Components must not contain mock data or business data; receive it through
  props or consume it through the appropriate application boundary.
- Client Components must receive only the minimum data needed for rendering and
  interaction.
- Keep fixture values deterministic when fixtures are part of a project.
- Import shared contracts into fixtures instead of duplicating domain types.
- Do not declare or duplicate domain types inside mock files.
- Put shared configuration in constants and environment-specific configuration
  in environment variables.
- Technical literals, SVG values and copy owned by generic components are allowed
  when they are not configuration or visual tokens.

## Styling

- Use Tailwind for most layout and styling when the project uses Tailwind.
- Use CSS Modules beside a component when complex styles or variants are not
  clearer as utilities.
- Declare colors, shadows and gradients as semantic tokens in the designated
  global style layer.
- Do not use hexadecimal, `rgb()`, `hsl()` or arbitrary color values directly
  in components or CSS Modules.
- CSS Modules consume colors through semantic token variables.
- Reusable SVGs should use `currentColor` when appropriate.
- Avoid inline styles except for values calculated dynamically at runtime.

## Code Verification

- Run the project's ESLint command after implementation changes.
- Run the project's TypeScript check with incremental output disabled when
  validating a clean result.
- Run the production build when the change affects application code, routing,
  configuration or server/client boundaries.
- Review the diff for hardcoded data, duplicated styles, incomplete JSDoc,
  missing `className` support, invalid imports and Server/Client violations.
- These tools do not replace architectural review.
