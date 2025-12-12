import type { EvolutionGeneration } from './digimon';

export interface ChallengeConfig {
	id: string;
	name: string;
	description: string;
	rules: ChallengeRule[];
	evolutionCheckpoints: EvolutionCheckpoint[];
	settings: ChallengeSettings;
}

export interface ChallengeRule {
	id: string;
	title: string;
	description: string;
}

export interface EvolutionCheckpoint {
	bossOrder: number;
	unlockedGeneration: EvolutionGeneration;
	allowReroll: boolean;
}

export interface ChallengeSettings {
	teamSize: number;
	hardModeRequired: boolean;
	allowDuplicates: boolean;
	maxRerollsPerCheckpoint?: number;
}

export interface ChallengeRunState {
	challengeId: string;
	seed: string;
	currentBossOrder: number;
	currentGeneration: EvolutionGeneration;
	team: TeamMember[];
	rerollHistory: RerollEvent[];
	createdAt: string;
	updatedAt: string;
}

export interface TeamMember {
	digimonNumber: string;
	slotIndex: number;
	rolledAtCheckpoint: number;
}

export interface RerollEvent {
	timestamp: string;
	checkpoint: number;
	previousTeam: string[];
	newTeam: string[];
	seed: string;
}

export interface AppState {
	version: string;
	lastVisitedChallenge?: string;
	preferences: UserPreferences;
}

export interface UserPreferences {
	theme?: 'light' | 'dark' | 'system';
}
