export interface Reservation {
  id: string;
  fieldId: string;
  userId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'pending' | 'pre_authorized' | 'paid' | 'refunded' | 'failed';
  teamName?: string;
  fieldName?: string;
  venueName?: string;
  address?: string;
}

export interface CreateReservationData {
  fieldId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  totalPrice: number;
  teamName?: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}
