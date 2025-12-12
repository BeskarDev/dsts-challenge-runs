import { describe, it, expect } from 'vitest';
import { getGrindosaurUrl, getGrindosaurIconUrl } from './digimon';

describe('Grindosaur URL helpers', () => {
	describe('getGrindosaurUrl', () => {
		it('should generate correct URL for simple name', () => {
			const url = getGrindosaurUrl('Agumon');
			expect(url).toBe('https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/agumon');
		});

		it('should handle names with spaces', () => {
			const url = getGrindosaurUrl('Omegamon Zwart');
			expect(url).toBe('https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/omegamon-zwart');
		});

		it('should handle names with parentheses', () => {
			const url = getGrindosaurUrl('Cherubimon (Good)');
			expect(url).toBe('https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/cherubimon-good');
		});

		it('should handle names with special characters', () => {
			const url = getGrindosaurUrl('Omnimon Alter-B');
			expect(url).toBe('https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/omnimon-alter-b');
		});

		it('should handle mixed case', () => {
			const url = getGrindosaurUrl('MetalGarurumon');
			expect(url).toBe('https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/metalgarurumon');
		});
	});

	describe('getGrindosaurIconUrl', () => {
		it('should generate correct icon URL for simple name', () => {
			const url = getGrindosaurIconUrl('Agumon');
			expect(url).toBe('https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/agumon-icon.png');
		});

		it('should handle names with spaces', () => {
			const url = getGrindosaurIconUrl('Omegamon Zwart');
			expect(url).toBe('https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/omegamon-zwart-icon.png');
		});

		it('should handle names with parentheses', () => {
			const url = getGrindosaurIconUrl('Cherubimon (Good)');
			expect(url).toBe('https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/cherubimon-good-icon.png');
		});

		it('should handle complex names', () => {
			const url = getGrindosaurIconUrl('Imperialdramon Paladin Mode');
			expect(url).toBe('https://www.grindosaur.com/img/games/digimon-story-time-stranger/icons/imperialdramon-paladin-mode-icon.png');
		});
	});
});
