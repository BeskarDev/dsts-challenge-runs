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
	seed: string; // Main seed - never changes, used for base team generation
	currentBossOrder: number;
	currentGeneration: EvolutionGeneration;
	team: TeamMember[];
	rerollHistory: RerollEvent[];
	bossTeams: Record<number, BossTeamSnapshot>; // Store team snapshot per boss
	createdAt: string;
	updatedAt: string;
}

export interface BossTeamSnapshot {
	bossOrder: number;
	generation: EvolutionGeneration;
	team: TeamMember[];
	seed: string; // Sub-seed for this specific boss team
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

// Historical run tracking for statistics
export interface HistoricalRun {
	id: string; // Unique ID for the historical run
	challengeId: string;
	challengeName: string;
	seed: string;
	startedAt: string;
	lastUpdatedAt: string;
	completedAt?: string; // undefined if not completed
	status: 'active' | 'completed' | 'abandoned';
	progress: {
		currentBossOrder: number;
		totalBosses: number;
		currentGeneration: EvolutionGeneration;
	};
	metadata: {
		totalRerolls: number;
		teamSize: number;
	};
	// Full challenge state for restoration
	fullState: ChallengeRunState;
}
