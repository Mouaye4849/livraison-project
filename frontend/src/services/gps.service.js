import api from "../api";

/**
 * POST /api/gps/update
 * Voyageur sends their current GPS coordinates.
 */
export const updateGpsLocation = (colisId, latitude, longitude) =>
    api.post("/gps/update", { colisId, latitude, longitude });

/**
 * GET /api/gps/latest/{colisId}
 * Colis owner and admin fetch the latest GPS position.
 */
export const getGpsLatest = (colisId) =>
    api.get(`/gps/latest/${colisId}`);
