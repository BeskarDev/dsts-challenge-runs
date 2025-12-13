import { describe, it, expect } from 'vitest';
import {
	getNonStandardEquivalent,
	getEffectiveGeneration,
	LUCEMON_GENERATION_EQUIVALENTS
} from './generation-equivalents';

describe('getNonStandardEquivalent', () => {
	describe('Lucemon special mappings', () => {
		it('should map Lucemon (Rookie) to Ultimate', () => {
			const result = getNonStandardEquivalent('039', 'Rookie');
			expect(result).toBe('Ultimate');
		});

		it('should map Lucemon CM (Ultimate) to Mega', () => {
			const result = getNonStandardEquivalent('296', 'Ultimate');
			expect(result).toBe('Mega');
		});

		it('should have consistent mappings in LUCEMON_GENERATION_EQUIVALENTS', () => {
			expect(LUCEMON_GENERATION_EQUIVALENTS['039']).toBe('Ultimate');
			expect(LUCEMON_GENERATION_EQUIVALENTS['296']).toBe('Mega');
		});
	});

	describe('Armor generation mappings', () => {
		it('should map early armor forms to Champion', () => {
			expect(getNonStandardEquivalent('179', 'Armor')).toBe('Champion'); // Submarimon
			expect(getNonStandardEquivalent('183', 'Armor')).toBe('Champion'); // Flamedramon
		});

		it('should map late-game armor forms to Mega', () => {
			expect(getNonStandardEquivalent('422', 'Armor')).toBe('Mega'); // Rapidmon (Armor)
			expect(getNonStandardEquivalent('423', 'Armor')).toBe('Mega'); // Magnamon
		});

		it('should default unmapped armor forms to Champion', () => {
			const result = getNonStandardEquivalent('999', 'Armor');
			expect(result).toBe('Champion');
		});
	});

	describe('Hybrid generation mappings', () => {
		it('should map human spirit forms to Champion', () => {
			expect(getNonStandardEquivalent('187', 'Hybrid')).toBe('Champion'); // Agunimon
			expect(getNonStandardEquivalent('188', 'Hybrid')).toBe('Champion'); // Lobomon
		});

		it('should map fusion forms to Ultimate', () => {
			expect(getNonStandardEquivalent('305', 'Hybrid')).toBe('Ultimate'); // Aldamon
			expect(getNonStandardEquivalent('306', 'Hybrid')).toBe('Ultimate'); // Beowolfmon
		});

		it('should map ancient spirit forms to Mega', () => {
			expect(getNonStandardEquivalent('424', 'Hybrid')).toBe('Mega'); // EmperorGreymon
			expect(getNonStandardEquivalent('425', 'Hybrid')).toBe('Mega'); // MagnaGarurumon
		});

		it('should default unmapped hybrid forms to Champion', () => {
			const result = getNonStandardEquivalent('999', 'Hybrid');
			expect(result).toBe('Champion');
		});
	});

	describe('Standard generation handling', () => {
		it('should return null for standard Rookie without special mapping', () => {
			const result = getNonStandardEquivalent('021', 'Rookie'); // Agumon
			expect(result).toBeNull();
		});

		it('should return null for standard Champion', () => {
			const result = getNonStandardEquivalent('075', 'Champion'); // Greymon
			expect(result).toBeNull();
		});

		it('should return null for standard Ultimate without special mapping', () => {
			const result = getNonStandardEquivalent('200', 'Ultimate'); // MetalGreymon
			expect(result).toBeNull();
		});

		it('should return null for standard Mega', () => {
			const result = getNonStandardEquivalent('321', 'Mega'); // WarGreymon
			expect(result).toBeNull();
		});
	});
});

describe('getEffectiveGeneration', () => {
	describe('Lucemon special mappings', () => {
		it('should return Ultimate for Lucemon (Rookie form)', () => {
			const result = getEffectiveGeneration('039', 'Rookie');
			expect(result).toBe('Ultimate');
		});

		it('should return Mega for Lucemon CM (Ultimate form)', () => {
			const result = getEffectiveGeneration('296', 'Ultimate');
			expect(result).toBe('Mega');
		});
	});

	describe('Armor generation mappings', () => {
		it('should return Champion for early armor forms', () => {
			expect(getEffectiveGeneration('179', 'Armor')).toBe('Champion'); // Submarimon
			expect(getEffectiveGeneration('183', 'Armor')).toBe('Champion'); // Flamedramon
		});

		it('should return Mega for late-game armor forms', () => {
			expect(getEffectiveGeneration('422', 'Armor')).toBe('Mega'); // Rapidmon (Armor)
			expect(getEffectiveGeneration('423', 'Armor')).toBe('Mega'); // Magnamon
		});
	});

	describe('Hybrid generation mappings', () => {
		it('should return Champion for human spirit forms', () => {
			expect(getEffectiveGeneration('187', 'Hybrid')).toBe('Champion'); // Agunimon
		});

		it('should return Ultimate for fusion forms', () => {
			expect(getEffectiveGeneration('305', 'Hybrid')).toBe('Ultimate'); // Aldamon
		});

		it('should return Mega for ancient spirit forms', () => {
			expect(getEffectiveGeneration('424', 'Hybrid')).toBe('Mega'); // EmperorGreymon
		});
	});

	describe('Standard generation handling', () => {
		it('should return actual generation for standard Rookie', () => {
			const result = getEffectiveGeneration('021', 'Rookie'); // Agumon
			expect(result).toBe('Rookie');
		});

		it('should return actual generation for standard Champion', () => {
			const result = getEffectiveGeneration('075', 'Champion'); // Greymon
			expect(result).toBe('Champion');
		});

		it('should return actual generation for standard Ultimate', () => {
			const result = getEffectiveGeneration('200', 'Ultimate'); // MetalGreymon
			expect(result).toBe('Ultimate');
		});

		it('should return actual generation for standard Mega', () => {
			const result = getEffectiveGeneration('321', 'Mega'); // WarGreymon
			expect(result).toBe('Mega');
		});
	});
});
