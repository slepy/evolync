# Patches

This directory contains patches for npm packages applied using `patch-package`.

## tamagui+1.142.0.patch

**Purpose**: Fixes React Native Web deprecation warning: `props.pointerEvents is deprecated. Use style.pointerEvents`

**Changes**:

- Replaces `pointerEvents: 'none'` with `userSelect: 'none'` and `cursor: 'default'` in `EnsureFlexed.tsx`
- Replaces `pointerEvents: 'none'` with `userSelect: 'none'` and `cursor: 'default'` in `VisuallyHidden.tsx`

**Why**: React Native Web 0.21+ deprecates passing `pointerEvents` as a prop. This patch uses alternative CSS properties that achieve the same effect without triggering deprecation warnings.

## lucide-react-native+0.561.0.patch

**Purpose**: Taps on an icon inside a button (`+`, `<` back chevron) did nothing; only the area around the icon fired `onPress`.

**Changes**:

- Every Lucide icon renders its `Svg` with `pointerEvents: "none"` by default (`Icon.js` and `createLucideIcon.js`, esm + cjs). A caller can still override it with a `pointerEvents` prop.

**Why**: With the New Architecture (`newArchEnabled`), the native `react-native-svg` view becomes the touch target and the press never reaches the parent pressable. Icons are never pressable on their own here, so making them transparent to touches fixes every button at once.

**Auto-applied**: Patches are automatically applied after `npm install` via the `postinstall` script.

**Maintenance**: This patch should be removed once Tamagui officially fixes this issue in a future release.
