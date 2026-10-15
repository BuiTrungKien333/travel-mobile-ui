# Home frontend preview

During UI development, the app opens Home directly without login or a running backend. The four tabs are Home, Trips, Memories, and a sample Profile screen with the language switcher.

`src/constants/development.ts` controls this temporary behavior with `UI_PREVIEW_ENABLED = __DEV__`. Session restoration is skipped and the real Profile query/logout screen is not mounted. Existing credentials are not changed. Release builds continue to require authentication.

To reconnect auth, set `UI_PREVIEW_ENABLED = false` and reload the app. The original session restoration, login guards and real Profile screen will be active again.

## Explore the mock UI

- Tap the sliders icon in the Home header (or **Đổi trạng thái / Change scenario** at the bottom).
- Choose new traveller, upcoming trip, ongoing trip, or past trips without new plans.
- The mock clock is **2026-10-21**. It is explicitly displayed so scenarios remain reproducible.
- View a plan, select a day, and add sample places. Create a dated draft to see Home select it when appropriate.
- During an ongoing trip, save a text moment and find it in Memories.
- Change language in Profile. Vietnamese remains the default.

These fixtures and additions are session-only. Switching scenarios resets the sample trips and notes; logging out or restarting the app also discards them. They never call planning/weather/memory endpoints or write to a backend. Weather suggestions and itinerary examples are labelled as illustrative.

## Integration boundaries

- `features/home/data/home-mocks.ts`: fixture data and clock.
- `features/home/utils/select-home.ts`: deterministic priority selection without mutating input.
- `features/home/providers/trip-preview-provider.tsx`: scoped Zustand store for cross-tab preview interactions. Actual server data should move into feature query hooks when APIs are available.
- `features/home/i18n/home-copy.ts`: Vietnamese and English copy.
- `features/home/components`: hero, timeline, contextual cards and native modal forms.

Home uses a bounded vertical ScrollView. Trips and Memories use FlatList with stable IDs. Entrance animations use Reanimated and respect the system reduced-motion preference. No dependency was added.

The four-state selector has targeted Node tests in `tests/home-selection.test.ts`. Native keyboard, screen-reader, Dynamic Type and Android/iOS release behavior still need real-device verification.
