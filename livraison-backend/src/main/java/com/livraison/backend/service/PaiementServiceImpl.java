package com.livraison.backend.service;

import com.livraison.backend.dto.PaiementDTO;
import com.livraison.backend.entity.*;
import com.livraison.backend.repository.ColisRepository;
import com.livraison.backend.repository.PaiementRepository;
import com.livraison.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaiementServiceImpl implements PaiementService {

    private final PaiementRepository paiementRepository;
    private final ColisRepository colisRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private static final double COMMISSION_RATE = 0.10; // 10%

    @Override
    public PaiementDTO payer(UUID colisId, TypePaiement typePaiement) {

        Colis colis = colisRepository.findById(colisId)
                .orElseThrow(() -> new RuntimeException("Colis introuvable ❌"));

        // ✅ Vérifier statut LIVRE
        if (colis.getStatut() != StatutColis.LIVRE) {
            throw new RuntimeException("Le colis doit être livré avant le paiement ❌");
        }


        if (colis.getTrajet() == null) {
            throw new RuntimeException("Ce colis n'est pas associé à un trajet ❌");
        }

        // ✅ Vérifier prix
        if (colis.getPrixProposeMRU() == null || colis.getPrixProposeMRU() <= 0) {
            throw new RuntimeException("Le prix du colis est invalide ❌");
        }

        // ✅ Vérifier double paiement
        if (paiementRepository.existsByColis(colis)) {
            throw new RuntimeException("Ce colis est déjà payé ❌");
        }

        // ✅ Récupérer utilisateur connecté
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User payeur = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable ❌"));

        User voyageur = colis.getTrajet().getVoyageur();
        double montant = colis.getPrixProposeMRU();

        double commissionAdmin = montant * COMMISSION_RATE;

        double montantVoyageur = montant - commissionAdmin;
        // ✅ Création paiement
        Paiement paiement = Paiement.builder()
                .montantMRU(montant)
                .commissionAdmin(commissionAdmin)
                .montantVoyageur(montantVoyageur)
                .statut(StatutPaiement.SUCCES)
                .typePaiement(typePaiement)
                .referenceTransaction(UUID.randomUUID().toString())
                .dateConfirmation(LocalDateTime.now())
                .colis(colis)
                .voyageur(voyageur)
                .payeur(payeur)
                .build();

        paiementRepository.save(paiement);

        colis.setStatut(StatutColis.TERMINE);
        colisRepository.save(colis);
        colisRepository.flush();

        // ✅ Notifications
        notificationService.createNotification(
                payeur,
                "Paiement effectué ✅",
                TypeNotification.SYSTEME
        );

        notificationService.createNotification(
                voyageur,
                "Vous avez reçu " + montantVoyageur + " MRU 💰",
                TypeNotification.SYSTEME
        );


        return PaiementDTO.builder()
                .id(paiement.getId())
                .montantMRU(paiement.getMontantMRU())
                .commissionAdmin(paiement.getCommissionAdmin())
                .montantVoyageur(paiement.getMontantVoyageur())
                .statut(paiement.getStatut())
                .typePaiement(paiement.getTypePaiement())
                .referenceTransaction(paiement.getReferenceTransaction())
                .dateConfirmation(paiement.getDateConfirmation())
                .build();
    }

    @Override
    public List<PaiementDTO> getMyPayments() {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        return paiementRepository.findByPayeur(user)
                .stream()
                .map(p -> PaiementDTO.builder()
                        .id(p.getId())
                        .montantMRU(p.getMontantMRU())
                        .statut(p.getStatut())
                        .typePaiement(p.getTypePaiement())
                        .referenceTransaction(p.getReferenceTransaction())
                        .dateConfirmation(p.getDateConfirmation())
                        .build()
                ).toList();
    }

    @Override
    public Double getAdminRevenue() {
        return paiementRepository.findAll()
                .stream()
                .mapToDouble(Paiement::getCommissionAdmin)
                .sum();
    }

    @Override
    public long getTotalTransactions() {
        return paiementRepository.count();
    }
}