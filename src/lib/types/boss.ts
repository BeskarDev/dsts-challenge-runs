export type DamageElement =
	| 'Fire'
	| 'Water'
	| 'Ice'
	| 'Wind'
	| 'Plant'
	| 'Earth'
	| 'Electric'
	| 'Light'
	| 'Dark'
	| 'Steel'
	| 'Neutral';

export type Attribute = 'Vaccine' | 'Data' | 'Virus';

// For backward compatibility, keep Element as union of both
export type Element = DamageElement | Attribute;

export interface Boss {
	id: string;
	name: string;
	level: number;
	order: number;
	location?: string;
	imageUrl?: string;
	/** If true, this boss is optional and not required for challenge completion */
	optional?: boolean;
	/** URL to the boss strategy guide */
	guideUrl?: string;
	/** Elements this boss is weak to (takes extra damage) */
	weaknesses?: Element[];
	/** Elements this boss resists (takes reduced damage) */
	resistances?: Element[];
	/** Elements this boss is immune to (takes no damage) */
	immunities?: Element[];
}
