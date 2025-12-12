import type { PageLoad } from './$types';
import type { ChallengeConfig } from '$lib/types/challenge';
import type { Digimon } from '$lib/types/digimon';
import type { Boss } from '$lib/types/boss';
import challengeConfig from '$data/challenges/random-evolution.json';
import digimonData from '$data/digimon.json';
import bossesData from '$data/bosses.json';

export const load: PageLoad = ({ params }) => {
	const { id } = params;
	
	// For now, we only have one challenge
	if (id !== 'random-evolution') {
		return {
			status: 404,
			error: new Error('Challenge not found')
		};
	}

	return {
		challenge: challengeConfig as ChallengeConfig,
		digimon: digimonData as Digimon[],
		bosses: bossesData as Boss[]
	};
};
