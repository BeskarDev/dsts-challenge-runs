# Image Scraping Status and Instructions

## Current Status: ❌ Unable to Complete Automatic Scraping

### Problem
The automated image scraping cannot be completed due to network access restrictions in the current environment:

- ❌ Game8 CDN (img.game8.co) - CONNECTION BLOCKED
- ❌ Wikimon (wikimon.net) - CONNECTION BLOCKED  
- ❌ Digimon APIs (digimon-api.vercel.app, digi-api.com) - CONNECTION TIMEOUT
- ❌ Community sites (digimonstorytimestranger.com) - CONNECTION BLOCKED

All external image sources are either blocked by network policies or timing out, preventing automated downloading of the actual Digimon and Boss images.

### What Has Been Done
✅ Created comprehensive database with all 475 Digimon
✅ Created blacklist configuration for special requirements
✅ Documented image URL patterns and sources
✅ Created scripts for downloading (ready to use with proper access)
✅ Enhanced placeholder images (better than initial basic SVGs)

### What Is Still Needed
❌ **Actual image files from Game8 or other sources**

## Solutions

### Option 1: Manual Download (Most Reliable)
Someone with unrestricted internet access needs to:

1. **Visit Game8 Digimon List**
   - URL: https://game8.co/games/Digimon-Story-Time-Stranger/archives/552892
   
2. **Extract Image URLs**
   ```javascript
   // Run in browser console on the Game8 page:
   const images = Array.from(document.querySelectorAll('img[src*="img.game8.co"]'))
     .map(img => ({
       name: img.alt || img.title,
       url: img.src
     }));
   console.log(JSON.stringify(images, null, 2));
   ```

3. **Download Images**
   - Use the provided script: `scripts/download-images.sh`
   - Or manually: Right-click each image → Save As
   - Or use wget/curl with the extracted URLs

4. **For Bosses**
   - URL: https://game8.co/games/Digimon-Story-Time-Stranger/archives/553558
   - Follow same process

### Option 2: Use Digimon API (Recommended if accessible)
If the Digimon APIs are accessible:

```bash
# Test API access first
curl "https://digi-api.com/api/v1/digimon/1"

# If successful, use provided script
node scripts/download-from-api.cjs
```

**Digi-API endpoints:**
- Base: `https://digi-api.com/api/v1/`
- Get Digimon: `/digimon/{id}` or `/digimon/{name}`
- Response includes image URLs

### Option 3: GitHub Sprite Collection
Download pre-collected sprites:
```bash
git clone https://github.com/kaisadilla/digimon-sprite-collection.git
# Copy relevant sprites to static/images/digimon/
```

### Option 4: Use CDN Links Directly (No Download)
Instead of downloading, update the JSON files to point directly to Game8's CDN:

```json
{
  "id": "21",
  "name": "Agumon",
  "stage": "Rookie",
  "imageUrl": "https://img.game8.co/4291853/[actual-hash].png/show"
}
```

**Pros:**
- No storage needed
- Always up-to-date

**Cons:**
- Depends on Game8's uptime
- Potential CORS issues
- Slower load times

## Image URL Patterns Documented

### Game8 Pattern
```
https://img.game8.co/{collection_id}/{hash}.png/show
```
Example: `https://img.game8.co/4291853/1dd82e99d614005a78dbfe7af49334d6.png/show`

### How to Find Hashes
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "img"
4. Navigate through Game8 Digimon pages
5. Copy image URLs as they load

## Priority Images Needed

### High Priority (Most Common)
1. **All Rookie Stage (60 Digimon)** - IDs 21-80
2. **All Champion Stage (83 Digimon)** - IDs 81-163
3. **Main Story Bosses (30 Bosses)** - All boss images

### Medium Priority
4. **Ultimate Stage (102 Digimon)** - IDs 164-265
5. **Popular Mega (50 Digimon)** - Common endgame forms

### Lower Priority
6. **Baby/In-Training (20 Digimon)** - IDs 1-20
7. **Remaining Mega (134 Digimon)**
8. **Armor/DLC (44 Digimon)** - IDs 431-475

## File Naming Convention
Images must follow this pattern:
- Convert name to lowercase
- Replace spaces with hyphens
- Remove parentheses and special characters
- Example: "Agumon (Black)" → "agumon-black.png"

## Current Placeholders
Until real images are obtained:
- Enhanced SVG placeholders with:
  - Color-coded by stage
  - Initials displayed
  - Stage label
  - Better visual design than original placeholders

## Next Steps

**For Repository Owner:**
1. Run image download script in unrestricted environment
2. OR provide access credentials for automated scraping
3. OR manually download priority images (Rookies, Champions, Bosses)
4. Commit images to repository
5. Verify images load correctly in application

**For Contributors:**
If you have access to the images, please:
1. Fork the repository
2. Download images following this guide
3. Add them to `static/images/digimon/` and `static/images/bosses/`
4. Submit a Pull Request

## Testing After Images Are Added
```bash
# Verify all images exist
node scripts/verify-images.cjs

# Check image sizes (should be > 1KB for real images)
find static/images/digimon -name "*.png" -size +1k | wc -l

# Run full validation
node scripts/validate-data.cjs
```

## Estimated File Sizes
- Digimon images: ~50-200KB each (JPEG/PNG from Game8)
- Boss images: ~50-200KB each
- Total: ~50-95MB for all images

## Legal Notes
- Images are copyrighted by Bandai Namco
- Use for fan projects / educational purposes
- Credit sources: Game8.co, Bandai Namco
- Do not redistribute commercially

---

**Status:** Awaiting manual image download due to network restrictions
**Last Updated:** 2025-12-11
**Contact:** See repository issues for assistance
