import type { PageLoad } from './$types';
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
		challenge: challengeConfig,
		digimon: digimonData,
		bosses: bossesData
	};
};
