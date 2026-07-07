WASALI – Plateforme Intelligente de Livraison de Colis par les Voyageurs

Présentation

WASALI est une plateforme web et mobile de livraison collaborative (Crowdshipping) permettant de mettre en relation les expéditeurs, les voyageurs et les destinataires afin de faciliter la livraison nationale et internationale de colis.
L'objectif est d'optimiser les trajets déjà prévus par les voyageurs tout en offrant aux expéditeurs une solution de livraison plus rapide, flexible et économique.

Fonctionnalités

Authentification et Sécurité

Authentification JWT

Connexion avec Google (Firebase)

Vérification par OTP (Email)

Gestion des rôles (Administrateur, Voyageur, Utilisateur)

Gestion des Colis

Création et publication de colis

Suivi du statut des colis

Acceptation des demandes par les voyageurs

Confirmation de livraison

Gestion des Voyages

Publication de trajets

Consultation des colis disponibles

Gestion des demandes de transport

Notifications et Temps Réel

Notifications en temps réel

WebSocket (STOMP + SockJS)

Suivi GPS en direct

Administration

Gestion des utilisateurs

Promotion des rôles

Activation/Désactivation des comptes

Supervision de la plateforme

Paiement

Intégration Bankily

Gestion sécurisée des transactions

Architecture Technique

Backend

Java 21

Spring Boot

Spring Security

JWT

Spring WebSocket

JPA / Hibernate

Maven

Frontend

React.js

Vite

Tailwind CSS

React Router

Axios

Base de Données

MySQL (Développement)

TiDB Cloud (Production)

Déploiement

Render (Backend)

Vercel (Frontend)

Structure du Projet

backend/ ├── auth/ ├── config/ ├── controller/ ├── entity/ ├── repository/ ├── security/ ├── service/ └── websocket/ frontend/ ├── src/ │ ├── Components/ │ ├── Pages/ │ ├── Services/ │ ├── Context/ │ └── Assets/ └── public/ 

Installation

Backend

Cloner le dépôt :
git clone https://github.com/votre-utilisateur/livraison-backend.git cd livraison-backend 
Configurer les variables d'environnement :
MYSQLHOST= MYSQLPORT= MYSQLDATABASE= MYSQLUSER= MYSQLPASSWORD= JWT_SECRET= JWT_EXPIRATION= MAIL_USERNAME= MAIL_PASSWORD= STREAM_API_KEY= STREAM_API_SECRET= BANKILY_BASE_URL= BANKILY_USERNAME= BANKILY_PASSWORD= BANKILY_CLIENT_ID= 
Lancer l'application :
mvn spring-boot:run 
Le backend sera accessible sur :
http://localhost:8080 

Frontend

Cloner le dépôt :
git clone https://github.com/votre-utilisateur/livraison-frontend.git cd livraison-frontend 
Installer les dépendances :
npm install 
Créer un fichier .env :
VITE_API_URL=http://localhost:8080 
Démarrer l'application :
npm run dev 
Le frontend sera accessible sur :
http://localhost:5173 

Documentation API

Swagger :
http://localhost:8080/swagger-ui/index.html 

Rôles Utilisateurs

Utilisateur (Expéditeur)

Créer des colis

Consulter l'état des livraisons

Gérer ses demandes

Voyageur

Publier des trajets

Accepter des colis

Confirmer les livraisons

Administrateur

Gérer les utilisateurs

Superviser la plateforme

Contrôler les activités

Sécurité

Authentification JWT

Chiffrement des mots de passe avec BCrypt

Vérification OTP par email

Protection des API REST

Gestion des autorisations par rôle

Configuration CORS

Déploiement

Frontend

npm run build 
Déploiement sur :

Vercel

Backend

mvn clean package 
Déploiement sur :

Render

Auteur

Moulaye Elhacen Selam
Étudiant en Licence 3 MIAGE
Faculté des Sciences et Techniques
Université de Nouakchott Al Aasriya

Licence

Projet réalisé dans le cadre d'un Projet de Fin d'Études (PFE) à des fins académiques.