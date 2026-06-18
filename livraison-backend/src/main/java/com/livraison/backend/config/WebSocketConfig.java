package com.livraison.backend.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.web.socket.config.annotation.*;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @PostConstruct
    public void logWsConfig() {
        log.info("╔══════════════════════════════════════════════╗");
        log.info("║  [WS-CONFIG] WebSocket endpoints registered  ║");
        log.info("╠══════════════════════════════════════════════╣");
        log.info("║  /ws    → raw STOMP WebSocket (no SockJS)    ║");
        log.info("║  /chat  → STOMP over SockJS                  ║");
        log.info("║  App prefix  : /app                          ║");
        log.info("║  Broker      : /topic  /queue                ║");
        log.info("║  Heartbeat   : 10s in / 10s out              ║");
        log.info("╚══════════════════════════════════════════════╝");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue")
              .setHeartbeatValue(new long[]{10_000, 10_000});
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Raw WebSocket — mobile uses this with forceBinaryWSFrames to bypass
        // OkHttp JNI null-byte truncation (which breaks text-frame STOMP CONNECT).
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        log.info("[WS-CONFIG] registered /ws  (raw WebSocket, binary-frame safe)");

        // SockJS fallback — used by the web browser client.
        registry.addEndpoint("/chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        log.info("[WS-CONFIG] registered /chat (SockJS, web browser)");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                StompCommand command = accessor.getCommand();

                if (command == null) return message;

                switch (command) {
                    case CONNECT:
                        log.info("[WS-IN]  ◆ CONNECT    session={}", accessor.getSessionId());
                        break;

                    case SEND:
                        log.info("[WS-IN]  ◆ SEND       dest={}  session={}  body={}",
                                accessor.getDestination(),
                                accessor.getSessionId(),
                                extractBody(message));
                        break;

                    case SUBSCRIBE:
                        log.info("[WS-IN]  ◆ SUBSCRIBE  dest='{}'  session={}  subId={}",
                                accessor.getDestination(),
                                accessor.getSessionId(),
                                accessor.getSubscriptionId());
                        break;

                    case DISCONNECT:
                        log.info("[WS-IN]  ◆ DISCONNECT session={}", accessor.getSessionId());
                        break;

                    default:
                        break;
                }
                return message;
            }

            private String extractBody(Message<?> message) {
                Object payload = message.getPayload();
                if (payload instanceof byte[] bytes) {
                    String s = new String(bytes);
                    return s.length() > 200 ? s.substring(0, 200) + "…" : s;
                }
                return payload != null ? payload.toString() : "(null)";
            }
        });
    }

    /**
     * Logs every outgoing STOMP frame the broker pushes to a client.
     * If [WS-OUT] MESSAGE appears but the client never logs RAW-MSG,
     * the transport is dropping the frame (extremely rare).
     * If [WS-OUT] MESSAGE never appears for a GPS topic, no client is
     * subscribed to that exact destination string — topic mismatch.
     */
    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                StompCommand command = accessor.getCommand();
                if (command == StompCommand.MESSAGE) {
                    int len = message.getPayload() instanceof byte[]
                            ? ((byte[]) message.getPayload()).length : -1;
                    log.info("[WS-OUT] ◆ MESSAGE → session='{}'  dest='{}'  subId={}  bytes={}",
                            accessor.getSessionId(),
                            accessor.getDestination(),
                            accessor.getSubscriptionId(),
                            len);
                }
                return message;
            }
        });
    }
}
