export interface Venue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  coverImage?: string;
  basePricePerHour?: number;
  averageRating?: number;
  totalReviews?: number;
  isActive: boolean;
  ownerName?: string;
  fields?: Field[];
}

export interface Field {
  id: string;
  venueId: string;
  name: string;
  fieldType: string;
  surfaceType?: string;
  hasLighting: boolean;
  hasRoof: boolean;
  isActive: boolean;
}
