export interface IMatchingPairItem {
  id: string;
  left_content: string;
  right_content: string;
}

export interface IMatchingPairJson {
  countdown: number;
  score_per_match: number;
  images?: string[]; // For backward compatibility
  items?: IMatchingPairItem[]; // New format for pair-or-no-pair
}
