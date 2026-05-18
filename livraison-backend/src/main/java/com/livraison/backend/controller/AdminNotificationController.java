package com.livraison.backend.controller;

import com.livraison.backend.dto.NotificationDTO;
import com.livraison.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    /**
     * Returns all notifications whose destinataire is the currently authenticated admin.
     * notifyAdmin() saves notifications with destinataire = admin User entity, so
     * getMyNotifications() (which queries by destinataire) returns the correct result.
     */
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDTO>> getAdminNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }
}
