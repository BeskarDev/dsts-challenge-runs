#!/usr/bin/env node

/**
 * Comprehensive Boss Data Import Script
 *
 * This script parses boss-table.html and generates bosses.json with ALL boss data.
 *
 * SPECIAL HANDLING:
 * - Fugamon, Ogremon, and Hyogamon appear as 3 separate entries in HTML but should be
 *   combined into ONE boss fight: "Fugamon & Ogremon & Hyogamon"
 * - All other multi-boss fights (e.g., "Titamon + SkullBaluchimon") are imported as-is
 * - Boss order starts at 0 (Chaosdramon tutorial boss)
 * - DLC bosses (Omnimon Zwart Defeat, Omnimon Alter-B, Parallelmon) are marked optional
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
/* eslint-enable @typescript-eslint/no-require-imports */

// Read and parse the HTML file
const htmlPath = path.join(__dirname, '..', 'boss-table.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

// Boss level mapping (from game data)
const bossLevels = {
	Chaosdramon: 12,
	Kuwagamon: 15,
	Raremon: 17,
	Cyclonemon: 19,
	Vademon: 21,
	'Greymon (Blue)': 23,
	Titamon: 25,
	Fugamon: 25,
	Ogremon: 25,
	Hyogamon: 25,
	'Fugamon & Ogremon & Hyogamon': 25,
	Parrotmon: 27,
	UltimateBrachiomon: 30,
	Vulcanusmon: 30,
	Sharkmon: 32,
	Cherrymon: 35,
	Okuwamon: 35,
	'Titamon + SkullBaluchimon': 38,
	SkullSeadramon: 40,
	Calmaramon: 42,
	Witchmon: 42,
	TyrantKabuterimon: 42,
	Callismon: 42,
	VenomMyotismon: 45,
	ZombiePlutomon: 50,
	'Power Loader': 50,
	Apollomon: 52,
	Dianamon: 52,
	'Junomon HM': 55,
	Barbamon: 56,
	Creepymon: 57,
	Lilithmon: 58,
	Leviamon: 59,
	'Lucemon SM': 60,
	'Beelzemon BM': 61,
	'Belphemon RM': 62,
	Chronomon: 70,
	'Omnimon Zwart Defeat': 99,
	'Omnimon Alter-B': 99,
	Parallelmon: 99
};

// DLC bosses
const dlcBosses = ['Omnimon Zwart Defeat', 'Omnimon Alter-B', 'Parallelmon'];

// Parse all table rows
const rows = Array.from(document.querySelectorAll('tbody tr'));
const parsedBosses = [];

for (const row of rows) {
	const bossCell = row.querySelector('.Boss_cell');
	const missionCell = row.querySelector('.Mission_cell');
	const weaknessCell = row.querySelector('.Weakness_cell');

	if (!bossCell || !missionCell || !weaknessCell) continue;

	// Extract boss name
	const bossLink = bossCell.querySelector('a.a-link');
	if (!bossLink) continue;

	const bossText = bossLink.textContent.trim();

	// Extract image URL and guide URL
	const img = bossLink.querySelector('img');
	const imageUrl = img ? img.getAttribute('src') || img.getAttribute('data-src') : '';
	const guideUrl = bossLink.getAttribute('href') || '';

	// Extract location
	const missionLink = missionCell.querySelector('a.a-link');
	const location = missionLink ? missionLink.textContent.trim() : '';

	// Extract weaknesses
	const weaknesses = [];
	const weaknessSection = Array.from(weaknessCell.querySelectorAll('b')).find((b) =>
		b.textContent.includes('Weak to:')
	);
	if (weaknessSection) {
		const weakDiv = weaknessSection.nextElementSibling;
		if (weakDiv && weakDiv.classList.contains('align')) {
			const images = weakDiv.querySelectorAll('img');
			images.forEach((img) => {
				let element = img.getAttribute('alt');
				// Map element names
				if (element === 'Electricity') element = 'Electric';
				if (element === 'Null') element = 'Neutral';
				weaknesses.push(element);
			});
		}
	}

	// Extract resistances
	const resistances = [];
	const resistSection = Array.from(weaknessCell.querySelectorAll('b')).find((b) =>
		b.textContent.includes('Resists:')
	);
	if (resistSection) {
		const resistDiv = resistSection.nextElementSibling;
		if (resistDiv && resistDiv.classList.contains('align')) {
			const images = resistDiv.querySelectorAll('img');
			images.forEach((img) => {
				let element = img.getAttribute('alt');
				// Map element names
				if (element === 'Electricity') element = 'Electric';
				if (element === 'Null') element = 'Neutral';
				resistances.push(element);
			});
		}
	}

	// Extract immunities
	const immunities = [];
	const immuneSection = Array.from(weaknessCell.querySelectorAll('b')).find((b) =>
		b.textContent.includes('No Damage from:')
	);
	if (immuneSection) {
		const immuneDiv = immuneSection.nextElementSibling;
		if (immuneDiv && immuneDiv.classList.contains('align')) {
			const images = immuneDiv.querySelectorAll('img');
			images.forEach((img) => {
				let element = img.getAttribute('alt');
				// Map element names
				if (element === 'Electricity') element = 'Electric';
				if (element === 'Null') element = 'Neutral';
				immunities.push(element);
			});
		}
	}

	parsedBosses.push({
		name: bossText,
		imageUrl,
		guideUrl,
		location,
		weaknesses,
		resistances,
		immunities
	});
}

console.log(`Parsed ${parsedBosses.length} boss entries from HTML`);

// Process bosses: combine Fugamon, Ogremon, Hyogamon into one entry
const processedBosses = [];
let skipNext = 0;

for (let i = 0; i < parsedBosses.length; i++) {
	if (skipNext > 0) {
		skipNext--;
		continue;
	}

	const boss = parsedBosses[i];

	// Special case: Combine Fugamon, Ogremon, Hyogamon
	if (boss.name === 'Fugamon' && i + 2 < parsedBosses.length) {
		const next1 = parsedBosses[i + 1];
		const next2 = parsedBosses[i + 2];

		// Check if next two are Ogremon and Hyogamon with same location
		if (
			next1.name === 'Ogremon' &&
			next2.name === 'Hyogamon' &&
			boss.location === next1.location &&
			boss.location === next2.location
		) {
			// Combine into one boss fight
			processedBosses.push({
				name: 'Fugamon & Ogremon & Hyogamon',
				imageUrl: boss.imageUrl, // Use Fugamon's image
				guideUrl: boss.guideUrl, // Use Fugamon's guide URL
				location: boss.location,
				weaknesses: boss.weaknesses,
				resistances: boss.resistances,
				immunities: boss.immunities
			});
			skipNext = 2; // Skip Ogremon and Hyogamon
			console.log('✓ Combined Fugamon, Ogremon, and Hyogamon into one boss fight');
			continue;
		}
	}

	// Add boss as-is
	processedBosses.push(boss);
}

console.log(`Processed ${processedBosses.length} total boss fights`);

// Generate final boss data with proper structure
const finalBosses = processedBosses.map((boss, index) => {
	// Get level from mapping
	const level = bossLevels[boss.name] || 50;

	// Determine if optional (tutorial boss or DLC)
	const optional = index === 0 || dlcBosses.includes(boss.name);

	const bossData = {
		id: `boss-${index}`,
		name: boss.name,
		level: level,
		order: index,
		location: boss.location,
		imageUrl: boss.imageUrl,
		guideUrl: boss.guideUrl,
		weaknesses: boss.weaknesses,
		resistances: boss.resistances,
		immunities: boss.immunities
	};

	// Only add optional field if true
	if (optional) {
		// Insert optional before location
		const { location, ...rest } = bossData;
		return {
			...rest,
			optional,
			location,
			imageUrl: bossData.imageUrl,
			guideUrl: bossData.guideUrl,
			weaknesses: bossData.weaknesses,
			resistances: bossData.resistances,
			immunities: bossData.immunities
		};
	}

	return bossData;
});

// Write to bosses.json
const outputPath = path.join(__dirname, '..', 'src', 'data', 'bosses.json');
fs.writeFileSync(outputPath, JSON.stringify(finalBosses, null, 2));

console.log(`\n✅ Successfully generated bosses.json with ${finalBosses.length} bosses`);
console.log('\nBoss summary:');
finalBosses.forEach((boss, i) => {
	const optionalText = boss.optional ? ' (Optional)' : '';
	console.log(`  ${i}. ${boss.name}${optionalText} - Lv.${boss.level} - ${boss.location}`);
});
