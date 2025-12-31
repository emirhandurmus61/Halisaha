import axios from '@/lib/axios';
import { Reservation, CreateReservationData, AvailableSlot } from '@/types/reservation.types';

export const reservationService = {
  // Tüm rezervasyonlarımı listele
  async getMyReservations(): Promise<Reservation[]> {
    const response = await axios.get('/reservations');
    return response.data.data;
  },

  // Rezervasyon detayı
  async getById(id: string): Promise<Reservation> {
    const response = await axios.get(`/reservations/${id}`);
    return response.data.data;
  },

  // Yeni rezervasyon oluştur
  async create(data: CreateReservationData): Promise<Reservation> {
    const response = await axios.post('/reservations', data);
    return response.data.data;
  },

  // Müsait saatleri getir
  async getAvailableSlots(
    fieldId: string,
    date: string
  ): Promise<{ date: string; bookedSlots: AvailableSlot[] }> {
    const response = await axios.get('/reservations/available-slots', {
      params: { fieldId, date },
    });
    return response.data.data;
  },

  // Rezervasyonu iptal et
  async cancel(id: string): Promise<void> {
    await axios.patch(`/reservations/${id}/cancel`);
  },
};
