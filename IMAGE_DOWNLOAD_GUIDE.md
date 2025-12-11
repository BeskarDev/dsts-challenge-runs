# Image Downloading Guide for Game8 Images

## Overview
This guide explains how to download actual Digimon and Boss images from Game8.co instead of using placeholders.

## Image URL Pattern
Game8 uses the following URL pattern for images:
```
https://img.game8.co/{collection_id}/{hash}.png/show
```

Example from the DOM:
```html
<img src="https://img.game8.co/4291853/1dd82e99d614005a78dbfe7af49334d6.png/show">
```

## Downloading Images

### Method 1: Browser DevTools (Manual)
1. Open the Digimon list page: https://game8.co/games/Digimon-Story-Time-Stranger/archives/552892
2. Open browser DevTools (F12)
3. Go to Network tab
4. Filter by "img"
5. Scroll through the page to load all images
6. Right-click on image URLs and "Copy image address"
7. Download using `wget` or `curl`:
   ```bash
   wget "https://img.game8.co/4291853/[hash].png/show" -O digimon-name.png
   ```

### Method 2: Web Scraping Script (Automated)
Create a script using puppeteer or playwright to:
1. Navigate to the page
2. Extract all `<img>` tags with src containing "img.game8.co"
3. Download each image to the appropriate folder

Example structure:
```javascript
const images = await page.$$eval('img[src*="img.game8.co"]', imgs => 
  imgs.map(img => ({
    src: img.src,
    alt: img.alt || img.title
  }))
);
```

### Method 3: Using the API (If Available)
Check if Game8 provides an API endpoint for accessing images directly.

## Directory Structure
Images should be saved to:
- Digimon: `/static/images/digimon/{slug}.png`
- Bosses: `/static/images/bosses/{slug}.png`

Where `{slug}` is generated from the Digimon/Boss name:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters like parentheses
- Example: "Agumon (Black)" → "agumon-black.png"

## Boss Images
Boss images can be found on: https://game8.co/games/Digimon-Story-Time-Stranger/archives/553558

Follow the same process as Digimon images.

## Image Format
- Format: PNG
- Typical size: varies (usually thumbnail sized for lists)
- Quality: Web-optimized

## Legal Considerations
- Images are copyrighted by Bandai Namco
- Use for fan projects and educational purposes falls under fair use
- Credit Game8.co and Bandai Namco appropriately
- Do not redistribute or claim ownership

## Alternative: CDN Linking
Instead of downloading, you could:
1. Extract the actual Game8 URLs
2. Update the JSON to point directly to Game8's CDN
3. Advantages: Always up-to-date, no storage needed
4. Disadvantages: Depends on Game8's uptime, potential CORS issues

Example:
```json
{
  "id": "21",
  "name": "Agumon",
  "stage": "Rookie",
  "imageUrl": "https://img.game8.co/4291853/abc123.png/show"
}
```

## Current Status
- **Placeholder images**: Currently using generated PNG placeholders
- **Todo**: Replace with actual Game8 images
- **Priority**: Phase 3 implementation

## Implementation Steps
1. Write scraping script to extract image URLs from Game8 pages
2. Map each Digimon/Boss name to its image URL
3. Download all images to appropriate directories
4. Update JSON files with correct image paths or direct URLs
5. Verify all images load correctly in the application
