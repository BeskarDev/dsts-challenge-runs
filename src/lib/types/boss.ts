export interface Boss {
	id: string;
	name: string;
	level: number;
	order: number;
	location?: string;
	imageUrl?: string;
	/** If true, this boss is optional and not required for challenge completion */
	optional?: boolean;
}
