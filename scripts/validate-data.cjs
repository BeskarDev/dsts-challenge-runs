#!/usr/bin/env node
// Simple validation script to verify the data files match the TypeScript interfaces
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

// Load data
const digimonPath = path.join(__dirname, '..', 'src', 'data', 'digimon.json');
const bossesPath = path.join(__dirname, '..', 'src', 'data', 'bosses.json');

const digimon = JSON.parse(fs.readFileSync(digimonPath, 'utf8'));
const bosses = JSON.parse(fs.readFileSync(bossesPath, 'utf8'));

const validStages = ['Baby', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Armor'];

// Validation functions
function validateDigimon(digimon) {
  const errors = [];
  
  digimon.forEach((d, index) => {
    if (!d.id || typeof d.id !== 'string') {
      errors.push(`Digimon ${index}: Missing or invalid id`);
    }
    if (!d.name || typeof d.name !== 'string') {
      errors.push(`Digimon ${index}: Missing or invalid name`);
    }
    if (!d.stage || !validStages.includes(d.stage)) {
      errors.push(`Digimon ${index} (${d.name}): Invalid stage "${d.stage}". Must be one of: ${validStages.join(', ')}`);
    }
    if (d.imageUrl && typeof d.imageUrl !== 'string') {
      errors.push(`Digimon ${index} (${d.name}): Invalid imageUrl`);
    }
  });
  
  return errors;
}

function validateBosses(bosses) {
  const errors = [];
  
  bosses.forEach((b, index) => {
    if (!b.id || typeof b.id !== 'string') {
      errors.push(`Boss ${index}: Missing or invalid id`);
    }
    if (!b.name || typeof b.name !== 'string') {
      errors.push(`Boss ${index}: Missing or invalid name`);
    }
    if (typeof b.level !== 'number') {
      errors.push(`Boss ${index} (${b.name}): Missing or invalid level`);
    }
    if (typeof b.order !== 'number') {
      errors.push(`Boss ${index} (${b.name}): Missing or invalid order`);
    }
    if (b.location && typeof b.location !== 'string') {
      errors.push(`Boss ${index} (${b.name}): Invalid location`);
    }
    if (b.imageUrl && typeof b.imageUrl !== 'string') {
      errors.push(`Boss ${index} (${b.name}): Invalid imageUrl`);
    }
  });
  
  // Check order sequence
  const orders = bosses.map(b => b.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i) {
      errors.push(`Boss order sequence broken: expected ${i}, found ${orders[i]}`);
    }
  }
  
  return errors;
}

// Run validations
console.log('Validating digimon.json...');
const digimonErrors = validateDigimon(digimon);
if (digimonErrors.length > 0) {
  console.error('❌ Digimon validation failed:');
  digimonErrors.forEach(err => console.error('  -', err));
} else {
  console.log(`✅ Digimon validation passed! (${digimon.length} entries)`);
  
  // Print stats
  const stats = {};
  digimon.forEach(d => {
    stats[d.stage] = (stats[d.stage] || 0) + 1;
  });
  console.log('   Stage distribution:');
  Object.entries(stats).forEach(([stage, count]) => {
    console.log(`   - ${stage}: ${count}`);
  });
}

console.log('\nValidating bosses.json...');
const bossesErrors = validateBosses(bosses);
if (bossesErrors.length > 0) {
  console.error('❌ Bosses validation failed:');
  bossesErrors.forEach(err => console.error('  -', err));
} else {
  console.log(`✅ Bosses validation passed! (${bosses.length} entries)`);
  console.log(`   Level range: ${Math.min(...bosses.map(b => b.level))} - ${Math.max(...bosses.map(b => b.level))}`);
}

// Exit with error if any validation failed
if (digimonErrors.length > 0 || bossesErrors.length > 0) {
  process.exit(1);
}

console.log('\n✅ All validations passed!');
