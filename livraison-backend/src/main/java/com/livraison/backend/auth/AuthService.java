package com.livraison.backend.auth;

import com.livraison.backend.entity.Role;
import com.livraison.backend.entity.User;
import com.livraison.backend.exception.BusinessException;
import com.livraison.backend.repository.UserRepository;
import com.livraison.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;


    // =============================
    // 🧾 REGISTER CLIENT
    // =============================
    public AuthResponse registerClient(RegisterRequest request) {

        validateRegister(request);

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getRole().name(), user.getEmail());
    }

    // =============================
    // 🚚 REGISTER VOYAGEUR
    // =============================
    public AuthResponse registerVoyageur(RegisterRequest request) {

        validateRegister(request);

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_VOYAGEUR)
                .enabled(true)
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getRole().name(), user.getEmail());
    }

    // =============================
    // 🔐 LOGIN
    // =============================
    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new BusinessException("Email ou mot de passe incorrect ❌"));

        if (!user.isEnabled()) {
            throw new BusinessException("Compte désactivé ❌");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            throw new BusinessException("Email ou mot de passe incorrect ❌");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getRole().name(), user.getEmail());
    }

    

    public AuthResponse googleAuth(GoogleRequest request) {

        if (request.getEmail() == null || request.getEmail().isEmpty()) {
            throw new BusinessException("Email invalide ❌");
        }

        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .name(request.getName())
                            .googleId(request.getGoogleId())
                            .provider("GOOGLE")
                            .role(Role.ROLE_USER)
                            .enabled(true)
                            .build();

                    return userRepository.save(newUser);
                });

        if (!user.isEnabled()) {
            throw new BusinessException("Compte désactivé ❌");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(token, user.getRole().name(), user.getEmail());
    }

    // =============================
    // 🔍 VALIDATION
    // =============================
    private void validateRegister(RegisterRequest request) {

        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email déjà utilisé ❌");
        }

        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BusinessException("Email invalide ❌");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new BusinessException("Mot de passe trop court (min 6) ❌");
        }
    }
}