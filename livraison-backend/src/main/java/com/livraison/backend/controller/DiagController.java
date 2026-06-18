package com.livraison.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Diagnostic endpoints — no JWT required (see SecurityConfig permitAll).
 *
 * Test from Android browser or curl:
 *   GET http://IP:8080/api/diag/ping
 *   GET http://IP:5173/api/diag/ping  (via Vite proxy)
 *
 * If ping responds, the backend is reachable.
 * Then test WebSocket connectivity separately using /ws or /chat endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/diag")
public class DiagController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        log.info("[DIAG] /api/diag/ping — backend reachable");
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("wsEndpoints", new String[]{"/ws", "/chat"});
        body.put("message", "Backend is reachable. WebSocket endpoints: ws://IP:8080/ws and ws://IP:8080/chat");
        return ResponseEntity.ok(body);
    }
}
