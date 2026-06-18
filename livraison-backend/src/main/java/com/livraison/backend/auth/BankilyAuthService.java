package com.livraison.backend.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankilyAuthService {

    private final WebClient webClient;

    @Value("${bankily.base-url}")
    private String baseUrl;

    @Value("${bankily.username}")
    private String username;

    @Value("${bankily.password}")
    private String password;

    @Value("${bankily.client-id}")
    private String clientId;

    public String getAccessToken() {

        String url = baseUrl + "/authentification";

        // ── Outgoing request diagnostics ─────────────────────────────────────
        log.info("══════════════════════════════════════════════════");
        log.info("[BANKILY-AUTH] ► Outgoing request");
        log.info("[BANKILY-AUTH]   URL        : POST {}", url);
        log.info("[BANKILY-AUTH]   Header     : Content-Type: application/x-www-form-urlencoded");
        log.info("[BANKILY-AUTH]   Header     : Accept: application/json");
        log.info("[BANKILY-AUTH]   Param      : grant_type = password");
        log.info("[BANKILY-AUTH]   Param      : username   = '{}'", username);
        log.info("[BANKILY-AUTH]   Param      : password   = '{}'", password == null ? "NULL" : (password.isEmpty() ? "<EMPTY>" : "***SET(" + password.length() + " chars)***"));
        log.info("[BANKILY-AUTH]   Param      : client_id  = '{}'", clientId);
        log.info("[BANKILY-AUTH]   username blank?   {}", username  == null || username.isBlank());
        log.info("[BANKILY-AUTH]   password blank?   {}", password  == null || password.isBlank());
        log.info("[BANKILY-AUTH]   client_id blank?  {}", clientId  == null || clientId.isBlank());
        log.info("══════════════════════════════════════════════════");

        // ── Properly URL-encoded form body (preserves special characters) ─────
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("username",   username);
        formData.add("password",   password);
        formData.add("client_id",  clientId);

        try {
            BankilyAuthResponse response =
                    webClient.post()
                            .uri(url)
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                            .accept(MediaType.APPLICATION_JSON)
                            .body(BodyInserters.fromFormData(formData))
                            .retrieve()
                            .onStatus(
                                    status -> status.isError(),
                                    clientResponse -> clientResponse.bodyToMono(String.class)
                                            .defaultIfEmpty("<empty body>")
                                            .map(body -> {
                                                log.error("══════════════════════════════════════════════════");
                                                log.error("[BANKILY-AUTH] ✗ Error response from Bankily");
                                                log.error("[BANKILY-AUTH]   HTTP Status : {}", clientResponse.statusCode().value());
                                                log.error("[BANKILY-AUTH]   Response Body : {}", body);
                                                log.error("══════════════════════════════════════════════════");
                                                return new RuntimeException(
                                                        "[BANKILY-AUTH] Bankily returned HTTP "
                                                        + clientResponse.statusCode().value()
                                                        + " — body: " + body);
                                            })
                            )
                            .bodyToMono(BankilyAuthResponse.class)
                            .block();

            log.info("[BANKILY-AUTH] ✓ Token obtained — expires_in={}", response.getExpiresIn());
            return response.getAccessToken();

        } catch (WebClientResponseException ex) {
            // Fallback: catches cases where onStatus didn't intercept
            log.error("══════════════════════════════════════════════════");
            log.error("[BANKILY-AUTH] ✗ WebClientResponseException");
            log.error("[BANKILY-AUTH]   HTTP Status   : {}", ex.getStatusCode().value());
            log.error("[BANKILY-AUTH]   Response Body : {}", ex.getResponseBodyAsString());
            log.error("══════════════════════════════════════════════════");
            throw ex;
        }
    }
}
