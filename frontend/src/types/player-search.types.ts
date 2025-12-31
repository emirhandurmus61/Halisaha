export interface PlayerSearch {
  id: string;
  userId: string;
  fieldId?: string;
  matchDate: string;
  matchTime: string;
  playersNeeded: number;
  preferredSkillLevel?: string;
  preferredPositions?: string[];
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  organizerName?: string;
  organizerElo?: number;
  joinedCount?: number;
  venue?: {
    name: string;
    city: string;
    district: string;
    address?: string;
  };
  field?: {
    name: string;
    fieldType: string;
  };
  organizer?: {
    name: string;
    elo: number;
    phone?: string;
  };
  participants?: PlayerSearchParticipant[];
}

export interface PlayerSearchParticipant {
  id: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  playerName: string;
  playerElo: number;
  preferredPosition?: string;
  createdAt: string;
}

export interface CreatePlayerSearchData {
  fieldId?: string;
  matchDate: string;
  matchTime: string;
  playersNeeded: number;
  preferredSkillLevel?: string;
  preferredPositions?: string[];
  description?: string;
}

export interface JoinPlayerSearchData {
  message?: string;
}
