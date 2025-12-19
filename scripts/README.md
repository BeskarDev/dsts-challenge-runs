# Evolution Data Scraping CLI Tool

This CLI tool scrapes evolution data (`evolvesFrom` and `evolvesTo` arrays) from Grindosaur's Digimon detail pages and updates the local `digimon.json` database.

## Prerequisites

Before using the scraper, install the required dependency:

```bash
npm install jsdom
```

## Usage

```bash
node scripts/scrape-evolution-data.cjs [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--url <url>` | Scrape a single URL (for testing) | - |
| `--throttle <ms>` | Delay between requests in milliseconds | 500 |
| `--debug` | Save raw HTML files for debugging | false |
| `--output <file>` | Output file path | `src/data/digimon.json` |
| `--resume` | Resume from last scraped position | false |
| `--start <number>` | Start from specific digimon number | 1 |
| `--end <number>` | End at specific digimon number | (all) |
| `--dry-run` | Parse but don't write output | false |
| `--help, -h` | Show help message | - |

## Examples

### Scrape All Evolution Data

```bash
node scripts/scrape-evolution-data.cjs
```

### Test with a Single URL

```bash
node scripts/scrape-evolution-data.cjs --url https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/kuramon
```

### Scrape with Slower Rate Limit

```bash
node scripts/scrape-evolution-data.cjs --throttle 1000
```

### Scrape with Debug Output

Save raw HTML files for debugging parsing issues:

```bash
node scripts/scrape-evolution-data.cjs --debug
```

Debug files are saved to `tmp/scrape-debug/`.

### Scrape a Specific Range

Process only digimon numbers 1-50:

```bash
node scripts/scrape-evolution-data.cjs --start 1 --end 50
```

### Resume Interrupted Scraping

If scraping was interrupted, resume from the last position:

```bash
node scripts/scrape-evolution-data.cjs --resume
```

### Dry Run (No File Changes)

Parse and display results without modifying files:

```bash
node scripts/scrape-evolution-data.cjs --dry-run
```

## Output

The script updates each Digimon entry in `digimon.json` with:

```json
{
  "number": "001",
  "name": "Kuramon",
  "generation": "In-Training I",
  "attribute": "No Data",
  "type": "Unidentified",
  "basePersonality": "Sly",
  "iconUrl": "https://www.grindosaur.com/img/...",
  "detailsUrl": "https://www.grindosaur.com/en/...",
  "evolvesFrom": [],
  "evolvesTo": ["Tsumemon", "Pagumon"]
}
```

## Error Handling

- The script continues on single-page failures (does not halt on errors)
- Failed entries are logged and summarized at the end
- HTTP errors (timeouts, non-200 responses) are retried up to 3 times
- Use `--debug` to save raw HTML for troubleshooting parsing issues

## Rate Limiting

Please respect the Grindosaur website:

1. Default throttle is 500ms between requests
2. Consider using `--throttle 1000` or higher for production scraping
3. Check robots.txt and site terms before scraping
4. Only scrape what you need; use `--start` and `--end` to limit scope

## Evolution Graph File

In addition to updating `digimon.json`, evolution data is also stored in a separate file:

- **`src/data/evolution-graph.json`** - Contains just the evolution relationships in a graph-friendly format for pathfinding

This file is used by the Evolution Pathfinder UI component.

## Troubleshooting

### Missing jsdom

```
Error: jsdom is required. Please install it:
  npm install jsdom
```

### Rate Limited

If you get many HTTP 429 errors, increase the throttle:

```bash
node scripts/scrape-evolution-data.cjs --throttle 2000
```

### Parsing Issues

Use debug mode to inspect raw HTML:

```bash
node scripts/scrape-evolution-data.cjs --url <problematic-url> --debug
```

Then inspect the saved HTML in `tmp/scrape-debug/`.
