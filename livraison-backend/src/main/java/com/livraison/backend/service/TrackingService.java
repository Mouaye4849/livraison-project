package com.livraison.backend.service;

import com.livraison.backend.dto.TrackingEventDTO;
import com.livraison.backend.entity.Colis;

import java.util.List;
import java.util.UUID;

public interface TrackingService {
    void createEvent(Colis colis, String status, String message, String locationName);
    List<TrackingEventDTO> getEventsByColisId(UUID colisId);
}
