import api from '@/services/api';
import type { Colis, ColisRequest } from '@/types';

// ─── Colis Service ────────────────────────────────────────────────────────────

export const colisService = {
  async getMyColis(): Promise<Colis[]> {
    const { data } = await api.get<Colis[]>('/colis/me');
    return data;
  },

  async getPublicColis(): Promise<Colis[]> {
    const { data } = await api.get<Colis[]>('/colis/public');
    return data;
  },

  async getById(id: string): Promise<Colis> {
    const { data } = await api.get<Colis>(`/colis/${id}`);
    return data;
  },

  async create(payload: ColisRequest): Promise<Colis> {
    const { data } = await api.post<Colis>('/colis', payload);
    return data;
  },

  async publish(id: string): Promise<Colis> {
    const { data } = await api.put<Colis>(`/colis/${id}/publish`);
    return data;
  },

  async cancel(id: string): Promise<Colis> {
    const { data } = await api.put<Colis>(`/colis/${id}/cancel`);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/colis/${id}`);
  },

  // Returns PUBLIE colis whose origin/destination match the trajet and fit its capacity.
  async getAvailableForTrajet(trajetId: string): Promise<Colis[]> {
    const { data } = await api.get<Colis[]>(`/colis/available/${trajetId}`);
    return data;
  },

  async assignToTrajet(colisId: string, trajetId: string): Promise<Colis> {
    const { data } = await api.put<Colis>(`/colis/${colisId}/assign/${trajetId}`);
    return data;
  },

  async startDelivery(id: string): Promise<Colis> {
    const { data } = await api.put<Colis>(`/colis/${id}/start`);
    return data;
  },

  async finishDelivery(id: string): Promise<Colis> {
    const { data } = await api.put<Colis>(`/colis/${id}/finish`);
    return data;
  },
};
