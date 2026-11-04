
export type pointsBody = {
  reason: string;
  points: number;
  team: teamBody;
  createdBy: string;
  createdAt: Date;
};

export type teamBody = {
  id?: string;
  name: string;
  color?: string; // Kept for chart compatibility, but will be phased out visually
  roster?: string[];
  logo?: string;
};

export type TeamList = {
  id: string;
  name: string;
  teams: { name: string; logo: string }[];
};

// Updated Match type for knockout to support two legs
export type Match = {
  id: string;
  round: number;
  matchNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  // Leg 1 scores
  score1_leg1: number | null;
  score2_leg1: number | null;
  // Leg 2 scores
  score1_leg2: number | null;
  score2_leg2: number | null;
  status: "pending" | "completed";
  nextMatchId: string | null;
  isBronzeMatch?: boolean;
};

export type Fixture = {
  round: number;
  leg?: 1 | 2;
  team1: teamBody;
  team2: teamBody | null;
  score1?: number;
  score2?: number;
  group?: string; // Added for group stage
};

export type tournamentBody = {
  id?: string;
  name: string;
  description?: string;
  rules?: string;
  format: "round_robin" | "knockout" | "group_then_knockout";
  matchType?: "single_leg" | "two_leg";
  status: "draft" | "upcoming" | "ongoing" | "completed";
  teams?: teamBody[]; // This is now primarily for form handling
  createdBy: string;
  createdAt: Date;
  fixtures?: Fixture[]; // For round-robin and group stage
  coverImageUrl?: string;
  numberOfTeams?: number;
  moderators?: string[];
};

export type UserProfile = {
  id: string;
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  coverImageURL?: string | null;
  whatsapp?: string | null;
  x?: string | null;
  facebook?: string | null;
  phone?: string | null;
  discord?: string | null;
  favoriteTournaments?: string[];
};

export type Comment = {
  id: string;
  text: string;
  createdBy: string;
  createdAt: any; // Firestore Timestamp
  authorName: string;
  authorPhotoURL: string | null;
};
