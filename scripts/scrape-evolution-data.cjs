#!/usr/bin/env node

/**
 * CLI Tool for Scraping Digimon Evolution Data from Grindosaur
 *
 * This script scrapes evolution data (evolvesFrom/evolvesTo) from each Digimon's
 * detail page on Grindosaur and updates the digimon.json database.
 *
 * Usage:
 *   node scripts/scrape-evolution-data.cjs [options]
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
 *   node scripts/scrape-evolution-data.cjs
 *   node scripts/scrape-evolution-data.cjs --throttle 1000 --debug
 *   node scripts/scrape-evolution-data.cjs --url https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/kuramon
 *   node scripts/scrape-evolution-data.cjs --start 1 --end 50 --dry-run
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
Digimon Evolution Data Scraper

Scrapes evolution data from Grindosaur and updates the digimon.json database.

Usage:
  node scripts/scrape-evolution-data.cjs [options]

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
  # Scrape all digimon evolution data
  node scripts/scrape-evolution-data.cjs

  # Scrape with slower rate limit and debug output
  node scripts/scrape-evolution-data.cjs --throttle 1000 --debug

  # Test with a single URL
  node scripts/scrape-evolution-data.cjs --url https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/kuramon

  # Scrape only first 50 digimon
  node scripts/scrape-evolution-data.cjs --start 1 --end 50

  # Resume interrupted scraping
  node scripts/scrape-evolution-data.cjs --resume
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
							'Mozilla/5.0 (compatible; DigimonEvolutionScraper/1.0; educational-project)',
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

// Parse evolution data from HTML content
function parseEvolutionData(html, digimonName) {
	if (!JSDOM) {
		JSDOM = require('jsdom').JSDOM;
	}

	const dom = new JSDOM(html);
	const document = dom.window.document;

	const evolvesFrom = [];
	const evolvesTo = [];

	// Grindosaur uses h2 headings with specific IDs followed by tables
	// Look for h2#evolves-to and h2#evolves-from sections
	
	// Find "Evolves to" section
	const evolvesToHeading = document.querySelector('h2#evolves-to');
	if (evolvesToHeading) {
		// Get the next sibling box/div that contains the table
		let nextElement = evolvesToHeading.nextElementSibling;
		while (nextElement) {
			const table = nextElement.querySelector('table');
			if (table) {
				const links = table.querySelectorAll('tbody tr a[href*="/digimon/"]');
				links.forEach((link) => {
					const name = link.textContent.trim();
					if (name && name !== digimonName && !evolvesTo.includes(name)) {
						evolvesTo.push(name);
					}
				});
				break;
			}
			// Check if we've hit the next section heading
			if (nextElement.tagName === 'H2') break;
			nextElement = nextElement.nextElementSibling;
		}
	}

	// Find "Evolves from" section  
	const evolvesFromHeading = document.querySelector('h2#evolves-from');
	if (evolvesFromHeading) {
		let nextElement = evolvesFromHeading.nextElementSibling;
		while (nextElement) {
			const table = nextElement.querySelector('table');
			if (table) {
				const links = table.querySelectorAll('tbody tr a[href*="/digimon/"]');
				links.forEach((link) => {
					const name = link.textContent.trim();
					if (name && name !== digimonName && !evolvesFrom.includes(name)) {
						evolvesFrom.push(name);
					}
				});
				break;
			}
			// Check if we've hit the next section heading
			if (nextElement.tagName === 'H2') break;
			nextElement = nextElement.nextElementSibling;
		}
	}

	// Fallback: Also check table captions for evolution data
	const tables = document.querySelectorAll('table');
	tables.forEach((table) => {
		const caption = table.querySelector('caption');
		if (!caption) return;
		
		const captionText = caption.textContent.toLowerCase();
		let tableType = null;
		
		if (captionText.includes('evolve') && captionText.includes('from')) {
			tableType = 'from';
		} else if (captionText.includes('evolve') && captionText.includes('into')) {
			tableType = 'to';
		} else if (captionText.includes('digivolve') && captionText.includes('into')) {
			tableType = 'to';
		}
		
		if (!tableType) return;

		const links = table.querySelectorAll('tbody tr a[href*="/digimon/"]');
		links.forEach((link) => {
			const name = link.textContent.trim();
			if (name && name !== digimonName) {
				if (tableType === 'from' && !evolvesFrom.includes(name)) {
					evolvesFrom.push(name);
				} else if (tableType === 'to' && !evolvesTo.includes(name)) {
					evolvesTo.push(name);
				}
			}
		});
	});

	// Alternative parsing: look for specific section containers
	const sections = document.querySelectorAll('[class*="evolution"], [class*="digivolution"]');
	sections.forEach((section) => {
		const links = section.querySelectorAll('a[href*="/digimon/"]');

		links.forEach((link) => {
			const name = link.textContent.trim();
			if (name && name !== digimonName) {
				// Determine direction based on context
				const parentText = link.closest('div, section, article')?.textContent.toLowerCase() || '';
				if (parentText.includes('from') || parentText.includes('pre-')) {
					if (!evolvesFrom.includes(name)) evolvesFrom.push(name);
				} else if (parentText.includes('to') || parentText.includes('post-')) {
					if (!evolvesTo.includes(name)) evolvesTo.push(name);
				}
			}
		});
	});

	// Alternative: look for lists with evolution data
	const listItems = document.querySelectorAll('li');
	listItems.forEach((li) => {
		const text = li.textContent.toLowerCase();
		const link = li.querySelector('a[href*="/digimon/"]');
		if (!link) return;

		const name = link.textContent.trim();
		if (name && name !== digimonName) {
			if (text.includes('from') || text.includes('de-digivolve')) {
				if (!evolvesFrom.includes(name)) evolvesFrom.push(name);
			} else if (text.includes('to') || text.includes('digivolve')) {
				if (!evolvesTo.includes(name)) evolvesTo.push(name);
			}
		}
	});

	return { evolvesFrom, evolvesTo };
}

// Save raw HTML for debugging
function saveDebugHtml(html, digimonName, debugDir) {
	const filename = digimonName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';
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
async function scrapeEvolutionData(options) {
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
	const debugDir = path.join(__dirname, '..', 'tmp', 'scrape-debug');
	if (options.debug && !fs.existsSync(debugDir)) {
		fs.mkdirSync(debugDir, { recursive: true });
	}

	// Progress file for resume functionality
	const progressFile = path.join(__dirname, '..', 'tmp', 'scrape-progress.json');
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
			const evolutionData = parseEvolutionData(html, 'Unknown');
			console.log('\nEvolution data:');
			console.log('  evolvesFrom:', evolutionData.evolvesFrom);
			console.log('  evolvesTo:', evolutionData.evolvesTo);
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
			digimon.evolvesFrom = progress.results[digimon.number].evolvesFrom;
			digimon.evolvesTo = progress.results[digimon.number].evolvesTo;
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

			const evolutionData = parseEvolutionData(html, digimon.name);

			// Update digimon data
			digimon.evolvesFrom = evolutionData.evolvesFrom;
			digimon.evolvesTo = evolutionData.evolvesTo;

			console.log(`  evolvesFrom: [${evolutionData.evolvesFrom.join(', ')}]`);
			console.log(`  evolvesTo: [${evolutionData.evolvesTo.join(', ')}]`);

			// Save progress
			progress.lastNumber = num;
			progress.results[digimon.number] = evolutionData;

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
	console.log('Scraping Complete');
	console.log('='.repeat(60));
	console.log(`Successful: ${successCount}`);
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
	console.log('Digimon Evolution Data Scraper');
	console.log('='.repeat(60));

	try {
		await scrapeEvolutionData(options);
	} catch (err) {
		console.error('\nFatal error:', err.message);
		process.exit(1);
	}
}

main();
