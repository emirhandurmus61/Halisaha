import axios from '@/lib/axios';
import { PlayerSearch, CreatePlayerSearchData, JoinPlayerSearchData } from '@/types/player-search.types';

export const playerSearchService = {
  // Tüm aktif oyuncu aramalarını listele
  async getAll(filters?: {
    city?: string;
    district?: string;
    skillLevel?: string;
    playerPosition?: string;
  }): Promise<PlayerSearch[]> {
    const response = await axios.get('/player-search', { params: filters });
    return response.data.data;
  },

  // Kullanıcının oyuncu aramalarını listele
  async getMySearches(): Promise<PlayerSearch[]> {
    const response = await axios.get('/player-search/my/listings');
    return response.data.data;
  },

  // Oyuncu arama detayı
  async getById(id: string): Promise<PlayerSearch> {
    const response = await axios.get(`/player-search/${id}`);
    return response.data.data;
  },

  // Yeni oyuncu araması oluştur
  async create(data: CreatePlayerSearchData): Promise<PlayerSearch> {
    const response = await axios.post('/player-search', data);
    return response.data.data;
  },

  // Oyuncu aramasına katıl
  async join(id: string, data?: JoinPlayerSearchData): Promise<void> {
    await axios.post(`/player-search/${id}/join`, data);
  },

  // Oyuncu aramasından ayrıl
  async leave(id: string): Promise<void> {
    await axios.post(`/player-search/${id}/leave`);
  },

  // Oyuncu aramasını iptal et
  async cancel(id: string): Promise<void> {
    await axios.patch(`/player-search/${id}/cancel`);
  },

  // Rezervasyon için bekleyen istekleri getir
  async getPendingRequests(reservationId: string): Promise<any[]> {
    const response = await axios.get(`/player-search/reservations/${reservationId}/requests`);
    return response.data.data;
  },

  // Katılım isteğini kabul et
  async acceptRequest(requestId: string): Promise<void> {
    await axios.patch(`/player-search/requests/${requestId}/accept`);
  },

  // Katılım isteğini reddet
  async rejectRequest(requestId: string): Promise<void> {
    await axios.patch(`/player-search/requests/${requestId}/reject`);
  },
};
