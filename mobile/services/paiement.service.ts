import api from '@/services/api';
import type { Paiement, TypePaiement } from '@/types';

export const paiementService = {
  async pay(colisId: string, type: TypePaiement): Promise<Paiement> {
    const { data } = await api.post<Paiement>(`/paiements/${colisId}?type=${type}`);
    return data;
  },

  async getMyPaiements(): Promise<Paiement[]> {
    const { data } = await api.get<Paiement[]>('/paiements/me');
    return data;
  },
};
