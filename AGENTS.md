# Tripzy Mobile — Agent Rules

Rules version: 1.1  
Canonical location: repository root `/AGENTS.md`

These rules apply to the entire repository. A nested `AGENTS.md` may add or override rules only for its own subtree.

## 1. Load once and minimize token usage

- Treat this file as the single source of truth. Do not duplicate it in prompts, plans, READMEs, or other instruction files.
- If these rules are already present in the agent's system/context, do not open, quote, or summarize this file again.
- Otherwise, read it once at the beginning of the working session and retain a short internal summary for that session.
- Re-read only when:
  - the user says this file changed;
  - Git or file metadata shows it changed after the last read;
  - work moves into a subtree containing a closer `AGENTS.md`;
  - context was compacted/lost and these rules are no longer available.
- Do not paste this entire file into a sub-agent prompt. Pass only the constraints relevant to the delegated task.
- Inspect only files needed for the current task. Prefer `rg`, targeted line ranges, and nearby implementations over broad repository reads.
- Do not scan `node_modules`, generated native code, build output, or lockfiles unless the task specifically concerns them.
- Do not repeat unchanged command output, long code blocks, documentation, or explanations in the final response.
- Keep plans and progress updates short. Stop when the acceptance criteria are met; do not add speculative improvements.

## 2. Project constraints

- Expo SDK 57, React Native 0.86, React 19.2, and TypeScript.
- Before using an uncertain Expo API, check the exact versioned docs: <https://docs.expo.dev/versions/v57.0.0/>.
- Do not use an API from `latest` docs until SDK 57 support is confirmed.
- Expo Router is the only navigation solution. Application code must not import external `@react-navigation/*` packages.
- Never bypass Router compatibility checks with `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK`.
- Do not change SDK, framework, TypeScript, dependency versions, or project configuration unless required by the task.
- Node.js version is intentionally not fixed here. Follow the repository toolchain/configuration and current Expo SDK 57 requirements.
- Preserve user changes. Avoid unrelated refactors, formatting sweeps, dependency upgrades, and generated-file edits.
- Prefer the smallest complete solution. Do not design for hypothetical future requirements.

## 3. Approved stack and ownership

| Concern                      | Use                                   |
| ---------------------------- | ------------------------------------- |
| Routing                      | `expo-router`                         |
| Server state                 | `@tanstack/react-query`               |
| HTTP                         | shared `axios` client                 |
| Forms                        | `react-hook-form` + `zod` + resolvers |
| Cross-screen client/UI state | `zustand`                             |
| Images                       | `expo-image`                          |
| Sensitive local data         | `expo-secure-store`                   |
| Animation/gestures           | Reanimated + Gesture Handler          |
| Safe areas                   | `react-native-safe-area-context`      |

- Keep local UI state in the component.
- Keep route/deep-link state in Expo Router params.
- Do not copy query data into Zustand or duplicate one value across state layers.
- Do not introduce a competing navigation, HTTP, query, form, validation, image, or state library.

## 4. Workflow

Before coding:

1. Inspect the relevant route/feature and search for reusable code or tokens.
2. Confirm the requested behavior and the smallest acceptance criteria.
3. Confirm proposed APIs and packages exist in the installed versions.

While coding:

- Keep the diff limited to the request.
- Follow nearby conventions when they do not conflict with this file.
- Implement production behavior; no dead code, fake data, commented alternatives, or unexplained `TODO`s.
- Fix root causes. Do not disable TypeScript, lint, Expo, or Router checks.
- Ask only when missing information would materially change behavior, data, security, or architecture.

Before finishing, run applicable checks:

```bash
npm run lint
npx tsc --noEmit
```

Run `npx expo-doctor` only after dependency, native module, Expo config, or SDK-related changes. Report changed files, checks actually run, and real limitations. Never claim an unexecuted test passed.

## 5. File placement

```text
src/
  app/                    # Thin Expo Router routes/layouts
  components/ui/          # Design-system primitives
  components/common/      # Reusable app compositions
  features/<feature>/     # Feature screens, components, hooks, api, schema, types
  hooks/                  # Cross-feature hooks only
  providers/              # Root providers
  services/api/           # Axios client and shared transport concerns
  store/                  # Cross-feature client state only
  theme/                  # Semantic design tokens
  constants/              # Shared configuration/copy/constants
  types/                  # Cross-feature types only
  utils/                  # Pure cross-feature helpers
```

- Routes only configure navigation, validate params, and render feature screens. No business logic or direct API calls.
- Keep feature-only code inside its feature; promote it only after real reuse.
- Use `@/` for cross-directory project imports and short relative imports within one module.
- Avoid broad barrel exports and circular dependencies.
- Split components by distinct responsibility, reuse, or readability—not arbitrary line count and not into meaningless fragments.
- Components/types use `PascalCase`; hooks use `useSomething`; handlers use `handleSomething`; callback props use `onSomething`.
- Route names follow Expo Router conventions exactly.

## 6. Expo Router SDK 57

- Import public routing APIs from `expo-router`.
- If a lower-level API is truly needed, use SDK 57 compatibility exports:
  - core/native/elements/routers: `expo-router/react-navigation`;
  - JS stack: `expo-router/js-stack`;
  - JS tabs: `expo-router/js-tabs`;
  - JS top tabs: `expo-router/js-top-tabs`.
- Use Expo Router's `Stack`; do not import `@react-navigation/native-stack`.
- Use `Stack.Protected` with `guard` for protected route groups. Do not use the SDK 58+ `redirectTo` prop.
- Validate route params at the boundary and do not navigate during render.

Reference: <https://docs.expo.dev/router/migrate/sdk-55-to-56/>.

## 7. TypeScript and React decisions

- Keep strict typing. Do not use `any`, `@ts-ignore`, double assertions, or unjustified non-null assertions.
- Treat network, storage, and route input as untrusted; narrow or validate it at the boundary.
- Use Zod for meaningful runtime boundaries, not repeatedly at every layer.
- Derive render values directly. Use effects only to synchronize with external systems or lifecycle-bound side effects.
- Keep state local unless multiple distant consumers genuinely need it.
- Use stable list keys. Never use array indexes for mutable/reorderable collections.
- Add `memo`, `useMemo`, and `useCallback` only for a measured cost or real identity requirement.
- Do not create a new abstraction for one simple use case.

## 8. API and state rules

- Keep one Axios client for base URL, timeout, auth headers, and normalized transport errors.
- Components and routes do not call Axios directly. Feature query/mutation hooks call feature API functions.
- Centralize typed query keys. Invalidate/update only affected queries and pass cancellation signals where supported.
- Do not blindly retry deterministic 4xx, authentication, authorization, or validation failures.
- Never swallow errors. Provide useful UI errors without leaking technical or sensitive data.
- Zustand stores must be small and domain-focused; subscribe to the smallest required slice.
- React Hook Form owns form values. Do not mirror every input in component or Zustand state.

## 9. UI and design system

- Brand: Ocean Teal. Primary palette seed: `#21B5C3`.
- Components consume semantic light/dark tokens from `src/theme`; they do not contain raw colors.
- Use theme tokens for typography, spacing, radius, elevation, z-index, and motion. Avoid unexplained magic values.
- Typography uses configured Roboto assets through semantic typography tokens; do not scatter font-family strings.
- Reuse/extend existing primitives such as `AppText`, `AppButton`, `AppInput`, and `Screen` before creating variants.
- Handle safe areas and keyboards intentionally; do not imitate them with arbitrary padding.
- Layout must support different widths, font scaling, text wrapping, light/dark themes, and long Vietnamese copy.
- Every async screen handles loading, success, empty, and error states. Mutations also handle disabled/submitting and retry behavior.
- Interactive targets should be at least 44×44 logical pixels and expose accessible label, role, state, and feedback.
- Do not rely on color alone. Target contrast: 4.5:1 for normal text and 3:1 for large text/non-text UI.
- Use `expo-image` with explicit dimensions/aspect ratio and intentional `contentFit`/cache behavior.
- Use the existing icon solution; do not add a package or use emoji as production icons.
- Centralize endpoints, repeated copy, route/query keys, configuration, and business constants at the narrowest shared scope.

## 10. Performance

- Optimize only a real or likely hot path; profile before adding complexity.
- Use virtualized lists for unbounded data, stable keys, lightweight rows, thumbnails, and pagination.
- Use `getItemLayout` and list batching/window tuning only when item geometry or profiling justifies them.
- Avoid broad Zustand subscriptions and heavy synchronous work during interactions.
- Prefer transform/opacity for frequent animation; use Reanimated for gesture/UI-thread-sensitive work.
- Keep static styles outside render. Do not blanket-memoize components or callbacks.
- Evaluate performance in a release build and remove debug logging from production paths.

## 11. Dependencies and security

Dependency order:

1. Existing React Native/JavaScript capability.
2. Installed Expo package.
3. Installed third-party package.
4. Small project-owned implementation.
5. New dependency only when justified.

- For Expo/native modules use `npx expo install <package>`; use npm for pure JavaScript packages.
- Before adding anything, verify SDK 57/RN 0.86/New Architecture compatibility, maintenance, bundle/native impact, and duplication.
- Do not add beta/canary packages or mix package managers without explicit approval.
- `EXPO_PUBLIC_*` values are public. Never ship private keys, service credentials, or privileged secrets.
- Store tokens in `expo-secure-store`; never in plain storage, logs, source code, or URL params.
- Redact authorization, credentials, personal data, location, and travel details from logs.
- Client route guards are UX only; backend authorization remains mandatory.

## 12. Definition of done

A task is complete when:

- requested behavior works without unrelated scope;
- code is in the correct layer and reuses the approved stack/tokens;
- there are no new TypeScript or lint errors;
- relevant async, theme, safe-area, keyboard, accessibility, and error states are handled;
- no secret, endpoint, raw theme value, or unexplained business constant is hardcoded;
- applicable checks/tests were run and reported honestly;
- the result is understandable without the AI conversation.

## External skill policy

- Priority order: user request → this AGENTS.md → existing project code and design tokens → external skills.
- Use `ui-ux-pro-max` for UI/UX direction, visual hierarchy, design-system decisions, and design critique.
- Use `react-native-guidelines` for React Native implementation and technical UI review.
- Activate skills only for relevant tasks. Do not load UI skills for backend, configuration, or unrelated work.
- Existing Tripzy branding overrides generated suggestions: Ocean Teal `#21B5C3`, Roboto, semantic light/dark tokens, and existing reusable components.
- A skill recommendation does not authorize installing a dependency. Check `package.json`, Expo SDK 57 compatibility, and request approval when a new package is genuinely required.
- Do not import external `@react-navigation/*`; Expo Router SDK 57 rules remain mandatory.

If a request conflicts with these rules, explain the conflict briefly and propose the smallest safe SDK-compatible alternative.
