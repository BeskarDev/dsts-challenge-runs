# Animation State Persistence Fix

## Problem

Previously, animation state (tracking which slot machine animations have been played) was stored separately from challenge state:

- Challenge state: `dsts:challenge:{challengeId}` (versioned, with migration support)
- Animation state: `dsts:animations:{challengeId}:{seed}` (NOT versioned, vulnerable to data loss)

When browsers clean up localStorage after a long period of inactivity (weeks/months), the animation state could be cleared while the challenge state remained. This caused teams to be hidden behind the slot machine animation again, even though they were previously revealed.

## Solution

The animation state has been **integrated into the challenge state itself**, making it part of the versioned, migrated data structure.

### Changes Made

1. **Type Changes** (`src/lib/types/challenge.ts`):
   - Added `revealedBosses?: Record<number, boolean>` field to `ChallengeRunState` interface

2. **Challenge Store Updates** (`src/lib/stores/challenge.ts`):
   - Added `markBossRevealed(bossOrder: number)` method to mark a boss as revealed
   - Added `isBossRevealed(state, bossOrder)` method to check if a boss is revealed
   - Updated `load()` to automatically migrate legacy animation state from separate storage
   - Updated `save()` to ensure `revealedBosses` is always initialized

3. **Animation Store Updates** (`src/lib/stores/animation.ts`):
   - Added `migrateAnimationState()` function to extract legacy animation state
   - Deprecated old animation functions (kept for backwards compatibility)
   - Added documentation explaining the deprecation

4. **Challenge Page Updates** (`src/routes/challenge/[id]/+page.svelte`):
   - Updated to use `challengeStore.markBossRevealed()` instead of `markAnimationPlayed()`
   - Updated to use `challengeStore.isBossRevealed()` instead of `hasAnimationPlayed()`
   - Removed dependency on separate animation storage

### Migration Path

When a user loads an existing challenge:

1. The challenge store checks if `revealedBosses` field exists
2. If missing, it calls `migrateAnimationState()` to load legacy animation data
3. Legacy animation state is converted from `"boss:1": true` format to `1: true` format
4. The migrated state is saved back to the challenge state
5. Future loads use the integrated state directly

### Benefits

- **Persistence**: Animation state now persists along with challenge state
- **Versioning**: Animation state benefits from the existing versioning system
- **Single Source of Truth**: All challenge-related data in one place
- **Migration**: Existing users' animation state is automatically migrated
- **Backwards Compatibility**: Old animation functions still work but are deprecated

### Testing

- 6 new tests verify animation state persistence
- All 195 tests passing
- Migration tests verify legacy state is properly converted
- No compilation errors or linting issues

## For Future Development

The old animation storage functions in `src/lib/stores/animation.ts` are deprecated but maintained for backwards compatibility. They can be safely removed in a future major version after ensuring all users have migrated.

### Deprecated Functions
- `hasAnimationPlayed()` → Use `challengeStore.isBossRevealed()` instead
- `markAnimationPlayed()` → Use `challengeStore.markBossRevealed()` instead
- `saveAnimationState()` → State is now saved automatically with challenge state
