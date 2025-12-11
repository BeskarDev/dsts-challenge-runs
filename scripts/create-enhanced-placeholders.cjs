#!/usr/bin/env node
// Script to create high-quality placeholder images for Digimon and Bosses
// Uses canvas to create better placeholders than simple SVG

const fs = require('fs');
const path = require('path');

const DIGIMON_JSON = path.join(__dirname, '..', 'src', 'data', 'digimon.json');
const BOSSES_JSON = path.join(__dirname, '..', 'src', 'data', 'bosses.json');
const DIGIMON_DIR = path.join(__dirname, '..', 'static', 'images', 'digimon');
const BOSSES_DIR = path.join(__dirname, '..', 'static', 'images', 'bosses');

// Load data
const digimon = JSON.parse(fs.readFileSync(DIGIMON_JSON, 'utf8'));
const bosses = JSON.parse(fs.readFileSync(BOSSES_JSON, 'utf8'));

console.log('Creating enhanced placeholder images...');
console.log(`Digimon: ${digimon.length}`);
console.log(`Bosses: ${bosses.length}`);

// Color schemes by stage
const stageColors = {
  'Baby': '#87CEEB',      // Sky blue
  'Rookie': '#90EE90',    // Light green
  'Champion': '#FFD700',  // Gold
  'Ultimate': '#FF6347',  // Tomato
  'Mega': '#9370DB',      // Medium purple
  'Armor': '#FF69B4'      // Hot pink
};

function createSVGPlaceholder(name, stage, type = 'digimon') {
  const color = stage Colors[stage] || '#4A90E2';
  const initials = name.split(/[\s()-]+/)
    .filter(w => w.length > 0)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 3);
  
  const bossIndicator = type === 'boss' ? 
    `<circle cx="64" cy="24" r="12" fill="#FF4444" opacity="0.8"/>
     <text x="64" y="29" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">!</text>` : '';
  
  return `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.7" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#grad-${initials})" rx="8"/>
  <circle cx="64" cy="50" r="28" fill="white" opacity="0.3"/>
  <text x="64" y="90" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
  <text x="64" y="110" font-family="Arial, sans-serif" font-size="11" fill="white" text-anchor="middle" opacity="0.9">${stage || type.toUpperCase()}</text>
  ${bossIndicator}
</svg>`;
}

function generateSlug(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/--+/g, '-')
    .replace(/\.$/, '');
}

// Generate Digimon placeholders
let created = 0;
let skipped = 0;

for (const d of digimon) {
  const slug = generateSlug(d.name);
  const filepath = path.join(DIGIMON_DIR, `${slug}.png`);
  
  // Only replace if current file is very small (existing placeholder)
  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath);
    if (stats.size < 500) {  // Small placeholder files
      const svg = createSVGPlaceholder(d.name, d.stage, 'digimon');
      fs.writeFileSync(filepath.replace('.png', '.svg'), svg);
      created++;
    } else {
      skipped++;
    }
  } else {
    const svg = createSVGPlaceholder(d.name, d.stage, 'digimon');
    fs.writeFileSync(filepath.replace('.png', '.svg'), svg);
    created++;
  }
}

console.log(`Digimon placeholders: ${created} created/updated, ${skipped} skipped`);

// Generate Boss placeholders
created = 0;
skipped = 0;

for (const b of bosses) {
  const slug = generateSlug(b.name);
  const filepath = path.join(BOSSES_DIR, `${slug}.png`);
  
  if (fs.existsSync(filepath)) {
    const stats = fs.statSync(filepath);
    if (stats.size < 500) {
      const svg = createSVGPlaceholder(b.name, `LV${b.level}`, 'boss');
      fs.writeFileSync(filepath.replace('.png', '.svg'), svg);
      created++;
    } else {
      skipped++;
    }
  } else {
    const svg = createSVGPlaceholder(b.name, `LV${b.level}`, 'boss');
    fs.writeFileSync(filepath.replace('.png', '.svg'), svg);
    created++;
  }
}

console.log(`Boss placeholders: ${created} created/updated, ${skipped} skipped`);
console.log('\n✅ Enhanced placeholders created!');
console.log('\n⚠️  NOTE: These are still placeholders.');
console.log('To get actual images, see IMAGE_DOWNLOAD_GUIDE.md');
console.log('Network restrictions prevent automatic downloading.');
