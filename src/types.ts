import { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  vehicleDetails?: string;
  createdAt: Timestamp;
}

export type OrderStatus = 'pending' | 'quoted' | 'accepted' | 'completed';

export interface Order {
  id: string;
  customerId: string;
  productName: string;
  productWorth: number;
  offeredPrice: number;
  pickupLocation: string;
  dropLocation: string;
  deliveryDate: Timestamp;
  additionalRequirements: string;
  status: OrderStatus;
  acceptedQuoteId?: string;
  acceptedOwnerId?: string;
  currentLocation?: { lat: number; lng: number };
  lastLocationUpdate?: Timestamp;
  createdAt: Timestamp;
}

export interface Quote {
  id: string;
  orderId: string;
  ownerId: string;
  ownerName: string;
  quoteValue: number;
  minQuoteValue: number;
  createdAt: Timestamp;
}
