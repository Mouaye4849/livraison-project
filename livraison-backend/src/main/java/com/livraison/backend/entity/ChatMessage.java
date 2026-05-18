package com.livraison.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID colisId;


    private String senderEmail;

    private String content;

    // 🆕 نوع الرسالة
    private String type; // TEXT | IMAGE | AUDIO

    // 🆕 رابط الملف
    private String fileUrl;

    private Date timestamp;
    private LocalDateTime createdAt;
}