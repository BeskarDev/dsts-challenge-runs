export type EvolutionStage = 'Baby' | 'Rookie' | 'Champion' | 'Ultimate' | 'Mega';

export interface Digimon {
	id: string;
	name: string;
	stage: EvolutionStage;
	imageUrl?: string;
	// Future extensibility
	attributes?: string[];
	types?: string[];
}
