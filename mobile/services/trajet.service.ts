import api from '@/services/api';
import type { Trajet, TrajetRequest } from '@/types';

export const trajetService = {
  async getMyTrajets(): Promise<Trajet[]> {
    const { data } = await api.get<Trajet[]>('/trajets/me');
    return data;
  },

  async getPublicTrajets(): Promise<Trajet[]> {
    const { data } = await api.get<Trajet[]>('/trajets/open');
    return data;
  },

  async getById(id: string): Promise<Trajet> {
    const { data } = await api.get<Trajet>(`/trajets/${id}`);
    return data;
  },

  async create(payload: TrajetRequest): Promise<Trajet> {
    const { data } = await api.post<Trajet>('/trajets', payload);
    return data;
  },

  async open(id: string): Promise<Trajet> {
    const { data } = await api.put<Trajet>(`/trajets/${id}/open`);
    return data;
  },

  async close(id: string): Promise<Trajet> {
    const { data } = await api.put<Trajet>(`/trajets/${id}/close`);
    return data;
  },

  async cancel(id: string): Promise<void> {
    await api.delete(`/trajets/${id}`);
  },
};
