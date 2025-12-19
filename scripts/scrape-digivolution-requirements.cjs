#!/usr/bin/env node

/**
 * CLI Tool for Scraping Digimon Digivolution Requirements from Grindosaur
 *
 * This script scrapes digivolution requirements (stats, agent rank, required items)
 * from each Digimon's detail page on Grindosaur and updates the digimon.json database.
 *
 * Usage:
 *   node scripts/scrape-digivolution-requirements.cjs [options]
 *
 * Options:
 *   --url <url>         Scrape a single URL (for testing)
 *   --throttle <ms>     Delay between requests in milliseconds (default: 500)
 *   --debug             Save raw HTML files for debugging
 *   --output <file>     Output file path (default: src/data/digimon.json)
 *   --resume            Resume from last scraped position
 *   --start <number>    Start from specific digimon number
 *   --end <number>      End at specific digimon number
 *   --dry-run           Parse but don't write output
 *   --help              Show this help message
 *
 * Examples:
 *   node scripts/scrape-digivolution-requirements.cjs
 *   node scripts/scrape-digivolution-requirements.cjs --throttle 1000 --debug
 *   node scripts/scrape-digivolution-requirements.cjs --url https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/flamedramon
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Optional dependencies - will be checked at runtime
let https;
let JSDOM;

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		url: null,
		throttle: 500,
		debug: false,
		output: path.join(__dirname, '..', 'src', 'data', 'digimon.json'),
		resume: false,
		start: null,
		end: null,
		dryRun: false,
		help: false
	};

	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case '--url':
				options.url = args[++i];
				break;
			case '--throttle':
				options.throttle = parseInt(args[++i], 10);
				break;
			case '--debug':
				options.debug = true;
				break;
			case '--output':
				options.output = args[++i];
				break;
			case '--resume':
				options.resume = true;
				break;
			case '--start':
				options.start = parseInt(args[++i], 10);
				break;
			case '--end':
				options.end = parseInt(args[++i], 10);
				break;
			case '--dry-run':
				options.dryRun = true;
				break;
			case '--help':
			case '-h':
				options.help = true;
				break;
			default:
				console.warn(`Unknown option: ${args[i]}`);
		}
	}

	return options;
}

// Show help message
function showHelp() {
	console.log(`
Digimon Digivolution Requirements Scraper

Scrapes digivolution requirements from Grindosaur and updates the digimon.json database.

Usage:
  node scripts/scrape-digivolution-requirements.cjs [options]

Options:
  --url <url>         Scrape a single URL (for testing)
  --throttle <ms>     Delay between requests in milliseconds (default: 500)
  --debug             Save raw HTML files for debugging
  --output <file>     Output file path (default: src/data/digimon.json)
  --resume            Resume from last scraped position
  --start <number>    Start from specific digimon number (e.g., 1)
  --end <number>      End at specific digimon number (e.g., 50)
  --dry-run           Parse but don't write output
  --help, -h          Show this help message

Examples:
  # Scrape all digimon evolution requirements
  node scripts/scrape-digivolution-requirements.cjs

  # Scrape with slower rate limit and debug output
  node scripts/scrape-digivolution-requirements.cjs --throttle 1000 --debug

  # Test with a single URL
  node scripts/scrape-digivolution-requirements.cjs --url https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/flamedramon

  # Scrape only first 50 digimon
  node scripts/scrape-digivolution-requirements.cjs --start 1 --end 50

  # Resume interrupted scraping
  node scripts/scrape-digivolution-requirements.cjs --resume
`);
}

// Delay function for throttling
function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch HTML content from a URL
async function fetchHtml(url, retries = 3) {
	if (!https) {
		https = require('https');
	}

	return new Promise((resolve, reject) => {
		const maxRedirects = 5;

		const makeRequest = (attemptNumber, redirectCount = 0) => {
			console.log(`  Fetching: ${url} (attempt ${attemptNumber}/${retries})`);

			const request = https.get(
				url,
				{
					headers: {
						'User-Agent':
							'Mozilla/5.0 (compatible; DigimonRequirementsScraper/1.0; educational-project)',
						Accept: 'text/html,application/xhtml+xml',
						'Accept-Language': 'en-US,en;q=0.9'
					},
					timeout: 30000
				},
				(response) => {
					// Handle redirects with limit
					if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
						if (redirectCount >= maxRedirects) {
							reject(new Error(`Too many redirects (${maxRedirects}) for ${url}`));
							return;
						}
						console.log(`  Redirecting to: ${response.headers.location}`);
						https.get(response.headers.location, (redirectResponse) => {
							handleResponse(redirectResponse, redirectCount + 1);
						});
						return;
					}

					handleResponse(response, redirectCount);
				}
			);

			function handleResponse(response, currentRedirectCount) {
				if (response.statusCode !== 200) {
					if (attemptNumber < retries) {
						console.log(`  Got status ${response.statusCode}, retrying...`);
						setTimeout(() => makeRequest(attemptNumber + 1, currentRedirectCount), 2000);
						return;
					}
					reject(new Error(`HTTP ${response.statusCode} for ${url}`));
					return;
				}

				let data = '';
				response.on('data', (chunk) => {
					data += chunk;
				});
				response.on('end', () => resolve(data));
			}

			request.on('error', (err) => {
				if (attemptNumber < retries) {
					console.log(`  Request error: ${err.message}, retrying...`);
					setTimeout(() => makeRequest(attemptNumber + 1), 2000);
					return;
				}
				reject(err);
			});

			request.on('timeout', () => {
				request.destroy();
				if (attemptNumber < retries) {
					console.log('  Request timeout, retrying...');
					setTimeout(() => makeRequest(attemptNumber + 1), 2000);
					return;
				}
				reject(new Error(`Timeout for ${url}`));
			});
		};

		makeRequest(1);
	});
}

// Parse a number from text, handling various formats
function parseStatValue(text) {
	if (!text || typeof text !== 'string') return null;
	
	// Remove any non-numeric characters except for decimal points
	const cleaned = text.replace(/[^\d.-]/g, '');
	const parsed = parseInt(cleaned, 10);
	
	return isNaN(parsed) ? null : parsed;
}

// Parse digivolution requirements from HTML content
function parseDigivolutionRequirements(html, digimonName) {
	if (!JSDOM) {
		JSDOM = require('jsdom').JSDOM;
	}

	const dom = new JSDOM(html);
	const document = dom.window.document;

	const requirements = {
		stats: {},
		agentRank: null,
		agentSkills: {},
		requiredItem: null,
		minBossOrder: null
	};

	// Look for Evolution Conditions section
	let evolutionSection = null;
	
	// Try multiple selectors for the evolution conditions section
	const possibleSelectors = [
		'h2#evolution-conditions',
		'h2#digivolution-conditions', 
		'h2#requirements',
		'h3#evolution-conditions',
		'h3#digivolution-conditions',
		'h3#requirements'
	];

	for (const selector of possibleSelectors) {
		evolutionSection = document.querySelector(selector);
		if (evolutionSection) break;
	}

	// Alternative: Look for text containing "Evolution" or "Digivolution"
	if (!evolutionSection) {
		const headings = document.querySelectorAll('h2, h3, h4');
		for (const heading of headings) {
			const text = heading.textContent.toLowerCase();
			if (text.includes('evolution') || text.includes('digivolution') || text.includes('requirements')) {
				evolutionSection = heading;
				break;
			}
		}
	}

	if (evolutionSection) {
		// Look for the next table after the evolution section
		let nextElement = evolutionSection.nextElementSibling;
		while (nextElement) {
			const table = nextElement.querySelector ? nextElement.querySelector('table') : null;
			if (table || nextElement.tagName === 'TABLE') {
				const targetTable = table || nextElement;
				parseRequirementsTable(targetTable, requirements);
				break;
			}
			
			// Check if we've hit the next major section
			if (nextElement.tagName && ['H1', 'H2'].includes(nextElement.tagName)) {
				break;
			}
			
			nextElement = nextElement.nextElementSibling;
		}
	}

	// Fallback: Look for any table with requirements-like headers
	if (!hasValidRequirements(requirements)) {
		const tables = document.querySelectorAll('table');
		for (const table of tables) {
			const headers = Array.from(table.querySelectorAll('th, td')).map(el => 
				el.textContent.toLowerCase().trim()
			);
			
			// Check if this table contains requirement-like headers
			const hasRequirementHeaders = headers.some(header => 
				header.includes('hp') || 
				header.includes('sp') || 
				header.includes('attack') ||
				header.includes('defense') ||
				header.includes('intelligence') ||
				header.includes('speed') ||
				header.includes('rank') ||
				header.includes('item')
			);
			
			if (hasRequirementHeaders) {
				parseRequirementsTable(table, requirements);
				if (hasValidRequirements(requirements)) {
					break;
				}
			}
		}
	}

	// Set boss progression requirements for special items
	setBossProgressionRequirements(requirements);

	// Clean up empty requirements
	if (Object.keys(requirements.stats).length === 0) {
		delete requirements.stats;
	}
	if (Object.keys(requirements.agentSkills).length === 0) {
		delete requirements.agentSkills;
	}

	return requirements;
}

// Parse requirements from a table
function parseRequirementsTable(table, requirements) {
	const rows = table.querySelectorAll('tr');
	
	// Try to find header row and data row
	let headerRow = null;
	let dataRows = [];
	
	for (const row of rows) {
		const cells = row.querySelectorAll('th, td');
		if (cells.length > 0) {
			const firstCellTag = cells[0].tagName.toLowerCase();
			if (firstCellTag === 'th' || row === rows[0]) {
				headerRow = row;
			} else {
				dataRows.push(row);
			}
		}
	}
	
	if (!headerRow || dataRows.length === 0) {
		// Try parsing as simple two-column table (label, value)
		parseSimpleTable(table, requirements);
		return;
	}
	
	// Get headers
	const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
		cell.textContent.toLowerCase().trim()
	);
	
	// Process each data row
	for (const dataRow of dataRows) {
		const cells = Array.from(dataRow.querySelectorAll('td, th'));
		
		for (let i = 0; i < Math.min(headers.length, cells.length); i++) {
			const header = headers[i];
			const value = cells[i].textContent.trim();
			
			parseRequirementCell(header, value, requirements);
		}
	}
}

// Parse simple two-column table format
function parseSimpleTable(table, requirements) {
	const rows = table.querySelectorAll('tr');
	
	for (const row of rows) {
		const cells = Array.from(row.querySelectorAll('td, th'));
		if (cells.length >= 2) {
			const label = cells[0].textContent.toLowerCase().trim();
			const value = cells[1].textContent.trim();
			
			parseRequirementCell(label, value, requirements);
		}
	}
}

// Parse individual requirement cell
function parseRequirementCell(header, value, requirements) {
	// Skip empty values
	if (!value || value === '-' || value === 'N/A') {
		return;
	}
	
	// Parse stats
	if (header.includes('hp')) {
		const hp = parseStatValue(value);
		if (hp !== null) requirements.stats.hp = hp;
	} else if (header.includes('sp') || header.includes('mp') || header.includes('spi')) {
		const sp = parseStatValue(value);
		if (sp !== null) requirements.stats.sp = sp;
	} else if (header.includes('attack') || header.includes('atk')) {
		const attack = parseStatValue(value);
		if (attack !== null) requirements.stats.attack = attack;
	} else if (header.includes('defense') || header.includes('def')) {
		const defense = parseStatValue(value);
		if (defense !== null) requirements.stats.defense = defense;
	} else if (header.includes('intelligence') || header.includes('int')) {
		const intelligence = parseStatValue(value);
		if (intelligence !== null) requirements.stats.intelligence = intelligence;
	} else if (header.includes('speed') || header.includes('spd')) {
		const speed = parseStatValue(value);
		if (speed !== null) requirements.stats.speed = speed;
	}
	
	// Parse agent skills
	else if (header.includes('valor') && header.includes('agent')) {
		const valor = parseStatValue(value);
		if (valor !== null) requirements.agentSkills.valor = valor;
	} else if (header.includes('philanthropy') && header.includes('agent')) {
		const philanthropy = parseStatValue(value);
		if (philanthropy !== null) requirements.agentSkills.philanthropy = philanthropy;
	} else if (header.includes('amicability') && header.includes('agent')) {
		const amicability = parseStatValue(value);
		if (amicability !== null) requirements.agentSkills.amicability = amicability;
	} else if (header.includes('wisdom') && header.includes('agent')) {
		const wisdom = parseStatValue(value);
		if (wisdom !== null) requirements.agentSkills.wisdom = wisdom;
	}
	
	// Parse agent rank (but not agent skills)
	else if ((header.includes('rank') || header.includes('agent')) && !header.includes('skills')) {
		const rank = parseStatValue(value);
		if (rank !== null) requirements.agentRank = rank;
	}
	
	// Parse required items
	else if (header.includes('item') || header.includes('req.')) {
		if (value && value !== '-' && value !== 'None') {
			requirements.requiredItem = value;
		}
	}
}

// Check if requirements object has any valid data
function hasValidRequirements(requirements) {
	return (
		(requirements.stats && Object.keys(requirements.stats).length > 0) ||
		requirements.agentRank !== null ||
		(requirements.agentSkills && Object.keys(requirements.agentSkills).length > 0) ||
		requirements.requiredItem !== null
	);
}

// Set boss progression requirements based on required items
function setBossProgressionRequirements(requirements) {
	if (!requirements.requiredItem) return;
	
	const item = requirements.requiredItem.toLowerCase();
	
	// Digi-Eggs (Armor Digimon) - most unlock after Vulcanusmon (boss order 10)
	if (item.includes('digi-egg') || item.includes('digimental')) {
		// Some early digi-eggs might be available earlier, but default to Vulcanusmon
		requirements.minBossOrder = 10;
	}
	
	// Human/Beast Spirits (Hybrid Digimon) - unlock after Vulcanusmon
	else if (item.includes('spirit')) {
		requirements.minBossOrder = 10;
	}
	
	// Other special items that might have boss requirements
	// Can be expanded based on game knowledge
}

// Save raw HTML for debugging
function saveDebugHtml(html, digimonName, debugDir) {
	const filename = digimonName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-requirements.html';
	const filepath = path.join(debugDir, filename);
	fs.writeFileSync(filepath, html);
	console.log(`  Saved debug HTML: ${filepath}`);
}

// Load progress file for resume functionality
function loadProgress(progressFile) {
	try {
		if (fs.existsSync(progressFile)) {
			const data = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
			return data;
		}
	} catch (err) {
		console.warn(`Could not load progress file: ${err.message}`);
	}
	return { lastNumber: 0, results: {} };
}

// Save progress for resume functionality
function saveProgress(progressFile, progress) {
	fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

// Main scraping function
async function scrapeDigivolutionRequirements(options) {
	// Check for required dependencies
	try {
		require('jsdom');
	} catch {
		console.error('Error: jsdom is required. Please install it:');
		console.error('  npm install jsdom');
		process.exit(1);
	}

	// Load existing digimon data
	let digimonData;
	try {
		digimonData = JSON.parse(fs.readFileSync(options.output, 'utf8'));
	} catch (err) {
		console.error(`Error loading digimon data from ${options.output}:`, err.message);
		process.exit(1);
	}

	console.log(`Loaded ${digimonData.length} digimon from ${options.output}`);

	// Setup debug directory
	const debugDir = path.join(__dirname, '..', 'tmp', 'requirements-debug');
	if (options.debug && !fs.existsSync(debugDir)) {
		fs.mkdirSync(debugDir, { recursive: true });
	}

	// Progress file for resume functionality
	const progressFile = path.join(__dirname, '..', 'tmp', 'requirements-progress.json');
	let progress = { lastNumber: 0, results: {} };

	if (options.resume) {
		progress = loadProgress(progressFile);
		console.log(`Resuming from digimon #${progress.lastNumber}`);
	}

	// Single URL mode
	if (options.url) {
		console.log(`\nScraping single URL: ${options.url}`);
		try {
			const html = await fetchHtml(options.url);
			if (options.debug) {
				saveDebugHtml(html, 'single-test', debugDir);
			}
			const requirementsData = parseDigivolutionRequirements(html, 'Unknown');
			console.log('\nDigivolution requirements:');
			console.log(JSON.stringify(requirementsData, null, 2));
		} catch (err) {
			console.error('Error scraping URL:', err.message);
		}
		return;
	}

	// Determine range to scrape
	const startNum = options.start || (options.resume ? progress.lastNumber + 1 : 1);
	const endNum = options.end || digimonData.length;

	console.log(`\nScraping digimon #${startNum} to #${endNum}`);
	console.log(`Throttle: ${options.throttle}ms between requests`);
	console.log(`Debug mode: ${options.debug}`);
	console.log(`Dry run: ${options.dryRun}`);
	console.log('');

	// Statistics
	let successCount = 0;
	let errorCount = 0;
	let requirementsFound = 0;
	const errors = [];

	// Process each digimon
	for (const digimon of digimonData) {
		const num = parseInt(digimon.number, 10);

		// Skip if outside range
		if (num < startNum || num > endNum) {
			continue;
		}

		// Skip if already processed (resume mode)
		if (options.resume && progress.results[digimon.number]) {
			digimon.evolutionRequirements = progress.results[digimon.number];
			if (hasValidRequirements(digimon.evolutionRequirements)) {
				requirementsFound++;
			}
			continue;
		}

		console.log(`\n[${digimon.number}/${digimonData.length}] ${digimon.name}`);

		if (!digimon.detailsUrl) {
			console.log('  No details URL, skipping...');
			errors.push({ number: digimon.number, name: digimon.name, error: 'No details URL' });
			errorCount++;
			continue;
		}

		try {
			const html = await fetchHtml(digimon.detailsUrl);

			if (options.debug) {
				saveDebugHtml(html, digimon.name, debugDir);
			}

			const requirementsData = parseDigivolutionRequirements(html, digimon.name);

			// Only add requirements if we found valid data
			if (hasValidRequirements(requirementsData)) {
				digimon.evolutionRequirements = requirementsData;
				requirementsFound++;
				
				console.log(`  Requirements found:`);
				if (requirementsData.stats && Object.keys(requirementsData.stats).length > 0) {
					console.log(`    Stats: ${JSON.stringify(requirementsData.stats)}`);
				}
				if (requirementsData.agentRank !== null) {
					console.log(`    Agent Rank: ${requirementsData.agentRank}`);
				}
				if (requirementsData.agentSkills && Object.keys(requirementsData.agentSkills).length > 0) {
					console.log(`    Agent Skills: ${JSON.stringify(requirementsData.agentSkills)}`);
				}
				if (requirementsData.requiredItem) {
					console.log(`    Required Item: ${requirementsData.requiredItem}`);
				}
				if (requirementsData.minBossOrder) {
					console.log(`    Min Boss Order: ${requirementsData.minBossOrder}`);
				}
			} else {
				console.log(`  No requirements found`);
			}

			// Save progress
			progress.lastNumber = num;
			progress.results[digimon.number] = requirementsData;

			if (!options.dryRun && options.resume) {
				saveProgress(progressFile, progress);
			}

			successCount++;
		} catch (err) {
			console.error(`  Error: ${err.message}`);
			errors.push({ number: digimon.number, name: digimon.name, error: err.message });
			errorCount++;

			// Don't halt on single page failure
			continue;
		}

		// Throttle requests
		if (num < endNum) {
			await delay(options.throttle);
		}
	}

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('Digivolution Requirements Scraping Complete');
	console.log('='.repeat(60));
	console.log(`Successful: ${successCount}`);
	console.log(`Requirements found: ${requirementsFound}`);
	console.log(`Errors: ${errorCount}`);

	if (errors.length > 0) {
		console.log('\nFailed entries:');
		errors.forEach((e) => {
			console.log(`  - ${e.number} ${e.name}: ${e.error}`);
		});
	}

	// Write output
	if (!options.dryRun) {
		console.log(`\nWriting output to ${options.output}...`);
		fs.writeFileSync(options.output, JSON.stringify(digimonData, null, '\t'));
		console.log('Done!');

		// Clean up progress file on successful completion
		if (successCount > 0 && errorCount === 0 && fs.existsSync(progressFile)) {
			fs.unlinkSync(progressFile);
			console.log('Cleaned up progress file.');
		}
	} else {
		console.log('\nDry run - no files modified.');
	}
}

// Main entry point
async function main() {
	const options = parseArgs();

	if (options.help) {
		showHelp();
		process.exit(0);
	}

	console.log('='.repeat(60));
	console.log('Digimon Digivolution Requirements Scraper');
	console.log('='.repeat(60));

	try {
		await scrapeDigivolutionRequirements(options);
	} catch (err) {
		console.error('\nFatal error:', err.message);
		process.exit(1);
	}
}

main();