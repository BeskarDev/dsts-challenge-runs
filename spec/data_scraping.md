# Data Scraping Documentation

## Overview

This document details the data scraping process performed for Phase 3 of the DSTS Challenge Runs project. All data was collected from publicly available web sources as specified in the requirements.

## Sources

### Primary Sources

- **Game8**: https://game8.co/games/Digimon-Story-Time-Stranger/
  - Complete Digimon List: https://game8.co/games/Digimon-Story-Time-Stranger/archives/552892
  - Mandatory Bosses List: https://game8.co/games/Digimon-Story-Time-Stranger/archives/553558
  - Walkthrough and Missions

### Supporting Sources

- **Digimon Fandom Wiki**: https://digimon.fandom.com/wiki/Digimon_Story:_Time_Stranger/
- **Destructoid**: https://www.destructoid.com/all-digimons-in-digimon-story-time-stranger/
- **FDAYTalk**: https://www.fdaytalk.com/all-digimon-in-digimon-story-time-stranger/
- **Dexerto**: https://www.dexerto.com/wikis/digimon-story-time-stranger/
- **GameRant**: https://gamerant.com/all-digimon-story-time-stranger-locations-get-how-where-find/
- **TheGamer**: https://www.thegamer.com/digimon-story-time-stranger-complete-digimon-list/
- **Neoseeker Walkthrough**: https://www.neoseeker.com/digimon-story-time-stranger/walkthrough

## Digimon Database

### Scope

- **Total Digimon in Database**: 475 (ALL Digimon including DLC)
- **Source Game**: Digimon Story: Time Stranger
- **Inclusions**:
  - All base game Digimon (1-457)
  - DLC Episode Pack 1 Digimon (458-463): BlitzGreymon, CresGarurumon, Omnimon variants, Parallelmon
  - DLC Episode Pack 2 Digimon (464-468): Omnimon Merciful Mode, Bancho series
  - DLC Episode Pack 3 Digimon (469-473): X-Antibody Royal Knights
  - Post-game exclusive Digimon (474-475): Chronomon Holy Mode, Chronomon Destroy Mode

### Blacklist Configuration

Instead of excluding Digimon from the database, a separate blacklist configuration file (`src/lib/data/digimon-blacklist.ts`) identifies Digimon with special requirements:

- **DLC Digimon**: Require Episode Pack purchases
- **Post-game Digimon**: Require completing main story
- **Armor Digimon**: Require Digi-Eggs
- **High Agent Rank**: Require Agent Rank 7-10
- **Skill Tree Requirements**: Require maxing specific skill categories
- **Mega+ Tier**: Generally late-game content

This approach allows the database to be adaptable to different use cases while maintaining flexibility for challenge run configurations.

### Stage Mapping

The game uses these evolution stages, mapped to our interface:

- **In-Training I** → `Baby`
- **In-Training II** → `Baby`
- **Rookie** → `Rookie`
- **Champion** → `Champion`
- **Ultimate** → `Ultimate`
- **Mega** → `Mega`
- **Mega+** → `Mega`

### Distribution by Stage

- **Baby** (In-Training I & II): 20 Digimon (IDs 1-20)
- **Rookie**: 60 Digimon (IDs 21-80)
- **Champion**: 83 Digimon (IDs 81-163, includes some hybrids)
- **Ultimate**: 102 Digimon (IDs 164-265)
- **Mega**: 184 Digimon (IDs 266-449, includes Mega+)
- **Armor**: 26 Digimon (IDs 431-457, some overlap with above ranges)

### Field Guide Numbers

The database uses sequential IDs (1-367) based on the scraped data. These IDs represent the field guide order from the game, though not all 475 game Digimon are included due to the exclusion of DLC and post-game content.

### Data Structure

Each Digimon entry contains:

```typescript
{
  id: string;              // Sequential ID based on field guide order
  name: string;            // Official Digimon name
  stage: EvolutionStage;   // Baby | Rookie | Champion | Ultimate | Mega
  imageUrl?: string;       // Path to placeholder image
}
```

### Notable Digimon Examples

- **#1 Kuramon** (Baby/In-Training I)
- **#21 Agumon** (Rookie)
- **#81 Aegiomon** (Champion)
- **#161 Piximon** (Ultimate)
- **#263 Armageddemon** (Mega)

## Bosses Database

### Scope

- **Total Bosses**: 30
- **Coverage**: All mandatory story bosses from main questline
- **Source**: Game8 walkthrough, Neoseeker walkthrough, Digimon Fandom Wiki missions

### Boss Progression

Bosses are ordered by story progression (order 0-29), with levels ranging from:

- **Early Game**: Level 12-25 (Orders 0-6)
- **Mid Game**: Level 27-42 (Orders 7-15)
- **Late Game**: Level 45-55 (Orders 16-20)
- **Final Chapter**: Level 55-70 (Orders 21-29)

### Data Structure

Each boss entry contains:

```typescript
{
  id: string;           // Format: "boss-{order}"
  name: string;         // Boss name
  level: number;        // Boss level (level cap for encounter)
  order: number;        // Story progression order (0-indexed)
  location?: string;    // Mission name where boss is encountered
  imageUrl?: string;    // Path to placeholder image
}
```

### Key Boss Encounters

- **Boss-0**: Chaosdramon (Level 12) - "Signs of an Anomaly"
- **Boss-10**: Sharkmon (Level 32) - "On the Shores of Another World"
- **Boss-20**: Junomon HM (Level 55) - "The Final Battle Over the Natural Order"
- **Boss-29**: Chronomon (Destroy) (Level 70) - Final boss

### Mission Structure

The game contains 30 main story missions, with bosses encountered at key progression points:

1. ADAMAS
2. Signs of an Anomaly (Bosses 0-1)
3. The View after the End
4. Reunions Bring Trouble (Boss 2)
5. The Time Stranger
6. Resonating Thoughts (Boss 3)
   ... (continues through mission 30)
7. The Final Battle Over the Natural Order (Bosses 20-29)

## Images

### Current Status: Placeholders

Currently, placeholder SVG and PNG images are used. The actual images from Game8.co should be downloaded and integrated.

### Image Source

Game8 uses the following pattern for images:

```
https://img.game8.co/{collection_id}/{hash}.png/show
```

Example from DOM:

```html
<img src="https://img.game8.co/4291853/1dd82e99d614005a78dbfe7af49334d6.png/show" />
```

### Integration Plan

See `IMAGE_DOWNLOAD_GUIDE.md` for detailed instructions on:

1. Scraping image URLs from Game8 pages
2. Downloading images to appropriate directories
3. Updating JSON references
4. Alternative: Direct CDN linking

### Placeholders (Temporary)

Until actual images are integrated:

- **Digimon Placeholder**: Blue theme (static/images/digimon/placeholder.svg)
- **Boss Placeholder**: Red theme (static/images/bosses/placeholder.svg)
- Individual placeholders generated for each entry

### Image References

All Digimon and boss entries contain `imageUrl` fields pointing to:

- Digimon: `/images/digimon/{slug}.png`
- Bosses: `/images/bosses/{slug}.png`

Where `{slug}` is generated from the name:

- Lowercase
- Spaces replaced with hyphens
- Special characters removed
- Example: "Greymon (Blue)" → "greymon-blue"

## Data Validation

### TypeScript Interface Compliance

The generated JSON files match the defined TypeScript interfaces:

**Digimon Interface** (`src/lib/types/digimon.ts`):

```typescript
type EvolutionStage = 'Baby' | 'Rookie' | 'Champion' | 'Ultimate' | 'Mega';

interface Digimon {
	id: string;
	name: string;
	stage: EvolutionStage;
	imageUrl?: string;
}
```

**Boss Interface** (`src/lib/types/boss.ts`):

```typescript
interface Boss {
	id: string;
	name: string;
	level: number;
	order: number;
	location?: string;
	imageUrl?: string;
}
```

### JSON Schema Validation

- All required fields are present
- All enum values match defined types
- IDs follow expected patterns
- No duplicate IDs or orders

## Exclusions Applied

### No Exclusions - Blacklist Configuration Instead

All 475 Digimon are included in the database for maximum flexibility. Special requirements are tracked in a separate blacklist configuration file.

See `src/lib/data/digimon-blacklist.ts` for:

- DLC Digimon (Episode Packs 1-3): 16 Digimon
- Post-game exclusives: 2 Digimon (Chronomon variants)
- Armor Digimon requirements: 13+ Digimon
- High Agent Rank requirements: 5+ Digimon
- Skill tree requirements: 3 Digimon
- Mega+ tier considerations

The blacklist provides helper functions:

- `isBlacklistedForChallengeRun(digimonId)`: Check if a Digimon should be excluded from challenge runs
- `getBlacklistReason(digimonId)`: Get the specific requirement/reason for blacklisting

## Notes

### Data Quality

- All data scraped from publicly available web sources
- Cross-referenced across multiple sources for accuracy
- Mission names and boss levels verified against multiple walkthroughs
- Some boss levels may vary by difficulty setting

### Future Enhancements

For future updates, consider:

1. Adding actual Digimon artwork (requires proper licensing or assets)
2. Expanding database with additional fields (attributes, types, stats)
3. Including evolution chains and requirements
4. Adding more detailed boss strategy information
5. Incorporating DLC content once available to all players

## Generation Scripts

The data was generated using Node.js scripts:

- `generate_time_stranger_data.js` - Generates digimon.json
- `generate_bosses.js` - Generates bosses.json
- `generate_placeholders.sh` - Creates placeholder images

All scripts are stored in the repository for reproducibility and future updates.

## Last Updated

December 11, 2024

## Contact

For questions about the data scraping process or to report inaccuracies, please open an issue in the GitHub repository.
