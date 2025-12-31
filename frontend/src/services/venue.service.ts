import axios from '@/lib/axios';
import { Venue } from '@/types/venue.types';

export const venueService = {
  // Tüm tesisleri listele
  async getAll(params?: { city?: string; district?: string }): Promise<Venue[]> {
    const response = await axios.get('/venues', { params });
    return response.data.data;
  },

  // Tesis detayı
  async getById(id: string): Promise<Venue> {
    const response = await axios.get(`/venues/${id}`);
    return response.data.data;
  },

  // Yeni tesis oluştur (sadece venue_owner)
  async create(data: Partial<Venue>): Promise<Venue> {
    const response = await axios.post('/venues', data);
    return response.data.data;
  },
};
