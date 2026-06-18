import api from '@/services/api';
import type { GpsLocation } from '@/types';

export const gpsService = {

  /**
   * POST /api/gps/update
   * Voyageur sends their current GPS coordinates.
   */
  async update(colisId: string, latitude: number, longitude: number): Promise<GpsLocation> {
    const { data } = await api.post<GpsLocation>('/gps/update', {
      colisId,
      latitude,
      longitude,
    });
    return data;
  },

  /**
   * GET /api/gps/latest/{colisId}
   * Colis owner / admin fetches the latest GPS position.
   */
  async getLatest(colisId: string): Promise<GpsLocation> {
    const { data } = await api.get<GpsLocation>(`/gps/latest/${colisId}`);
    return data;
  },
};
