export interface Establishment {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  userId: string; // ID du professeur propriétaire
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEstablishmentRequest {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
} 