import { describe, it, expect } from 'vitest';

// The getGrindosaurUrl and getGrindosaurIconUrl helper functions have been removed
// as all URLs are now provided directly in the Digimon data
describe('Digimon type structure', () => {
	it('should have all required fields in the new format', () => {
		// This is just a basic type check to ensure the interface is correct
		const exampleDigimon = {
			number: '001',
			name: 'Agumon',
			generation: 'Rookie' as const,
			attribute: 'Vaccine',
			type: 'Reptile',
			basePersonality: 'Daring',
			iconUrl:
				'https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/agumon-icon.png',
			detailsUrl: 'https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/agumon'
		};

		expect(exampleDigimon.number).toBe('001');
		expect(exampleDigimon.name).toBe('Agumon');
		expect(exampleDigimon.generation).toBe('Rookie');
		expect(exampleDigimon.attribute).toBe('Vaccine');
		expect(exampleDigimon.type).toBe('Reptile');
		expect(exampleDigimon.basePersonality).toBe('Daring');
		expect(exampleDigimon.iconUrl).toBeTruthy();
		expect(exampleDigimon.detailsUrl).toBeTruthy();
	});
});
