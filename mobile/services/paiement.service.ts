import api from '@/services/api';
import type { Paiement, TypePaiement } from '@/types';

export interface PaiementRequest {
  typePaiement: TypePaiement;
  clientPhone?: string;
  passcode?: string;
}

export const paiementService = {
  async pay(colisId: string, request: PaiementRequest): Promise<Paiement> {
    const { data } = await api.post<Paiement>(`/paiements/${colisId}`, request);
    return data;
  },

  async getMyPaiements(): Promise<Paiement[]> {
    const { data } = await api.get<Paiement[]>('/paiements/me');
    return data;
  },
};
