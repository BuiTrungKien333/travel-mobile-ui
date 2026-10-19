# Navigation glyphs

Project-owned 24×24 SVG assets for the floating navigation bar. The rounded home, compass, album and profile glyphs use a consistent 1.75-unit stroke, generous internal space and rounded line caps. The existing `solid` variant selects the active duotone treatment: translucent fill plus a solid focal detail. Opacity is preserved when tinted with semantic theme colors.

The camera uses the matching outline design. The original folded-map glyph remains available for map-specific content; the Trips tab uses a compass. Header icons are separate 1.5-unit-stroke assets.

`AppIcon` renders these explicit variants through the installed `expo-image`, with semantic tint colors. Other icons retain the existing Expo Symbols renderer. No additional icon package or SVG transformer is required.
