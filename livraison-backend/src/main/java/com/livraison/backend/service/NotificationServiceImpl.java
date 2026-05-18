package com.livraison.backend.service;

import com.livraison.backend.dto.NotificationDTO;
import com.livraison.backend.entity.*;
import com.livraison.backend.repository.NotificationRepository;
import com.livraison.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ── Fetch ──────────────────────────────────────────────────────────────────

    @Override
    public List<NotificationDTO> getMyNotifications() {
        String email = currentEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByDestinataireOrderByDateEnvoiDesc(user)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public long getUnreadCount() {
        String email = currentEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByDestinataireAndStatut(user, StatutNotification.ENVOYE);
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    @Override
    public void createNotification(User user, String message, TypeNotification type) {
        Notification n = Notification.builder()
                .destinataire(user)
                .message(message)
                .type(type)
                .statut(StatutNotification.ENVOYE)
                .dateEnvoi(LocalDateTime.now())
                .build();
        notificationRepository.save(n);
        pushToUser(user.getEmail(), mapToDTO(n));
    }

    @Override
    public void notifyAdmin(String message, TypeNotification type) {
        List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
        for (User admin : admins) {
            Notification n = Notification.builder()
                    .message(message)
                    .type(type)
                    .statut(StatutNotification.ENVOYE)
                    .dateEnvoi(LocalDateTime.now())
                    .destinataire(admin)
                    .build();
            notificationRepository.save(n);
            pushToUser(admin.getEmail(), mapToDTO(n));
        }
    }

    @Override
    public void sendNotification(String message) {
        String email = currentEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Notification n = Notification.builder()
                .message(message)
                .statut(StatutNotification.ENVOYE)
                .destinataire(user)
                .dateEnvoi(LocalDateTime.now())
                .type(TypeNotification.SYSTEME)
                .build();
        notificationRepository.save(n);
        pushToUser(user.getEmail(), mapToDTO(n));
    }

    // ── Mark as read ───────────────────────────────────────────────────────────

    @Override
    public void markAsRead(UUID id) {
        String email = currentEmail();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getDestinataire().getEmail().equals(email)) {
            throw new RuntimeException("Access denied");
        }
        notification.setStatut(StatutNotification.LU);
        notificationRepository.save(notification);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .statut(notification.getStatut())
                .type(notification.getType())
                .dateEnvoi(notification.getDateEnvoi())
                .build();
    }

    /**
     * Pushes the new notification over STOMP to the user's personal topic.
     * The frontend subscribes to /topic/notif/{email-encoded}.
     * Failure to push is silently swallowed — REST polling is the fallback.
     */
    private void pushToUser(String email, NotificationDTO dto) {
        try {
            String topic = "/topic/notif/" + encodeEmail(email);
            messagingTemplate.convertAndSend(topic, dto);
        } catch (Exception ignored) {
        }
    }

    /** Replace characters that conflict with STOMP destination path parsing. */
    private String encodeEmail(String email) {
        return email.replace("@", "__at__").replace(".", "__dot__");
    }
}
