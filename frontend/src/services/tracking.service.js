import api from "../api";

/**
 * GET /api/tracking/colis/{colisId}
 * Returns the ordered list of tracking events for a given colis.
 * JWT is added automatically by the api interceptor.
 */
export const getTrackingByColisId = (colisId) =>
    api.get(`/tracking/colis/${colisId}`);
