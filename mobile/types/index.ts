// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'ROLE_USER' | 'ROLE_VOYAGEUR' | 'ROLE_ADMIN';

export type ColisStatut =
  | 'BROUILLON'
  | 'PUBLIE'
  | 'ACCEPTE'
  | 'EN_COURS'
  | 'LIVRE'
  | 'TERMINE'
  | 'ANNULE';

export type TrajetStatut =
  | 'EN_ATTENTE'
  | 'OUVERT'
  | 'COMPLET'
  | 'EN_COURS'
  | 'TERMINE'
  | 'ANNULE'
  | 'REFUSE';

export type TypePaiement = 'CASH' | 'MOBILE_MONEY' | 'CARTE';
export type StatutPaiement = 'EN_ATTENTE' | 'SUCCES' | 'ECHEC';
export type TypeNotification = 'SYSTEME' | 'EMAIL' | 'SMS' | 'PUSH';
export type StatutNotification = 'ENVOYE' | 'LU' | 'ECHEC';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  role: UserRole;
  email: string;
}

export interface StoredUser {
  email: string;
  role: UserRole;
  name?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  enabled: boolean;
  provider?: string;
}

// ─── Colis ────────────────────────────────────────────────────────────────────

export interface ColisRequest {
  nom: string;
  poidsKg: number;
  quantite: number;
  prixProposeMRU: number;
  villeDepart: string;
  villeArrivee: string;
  nomDestinataire: string;
  numDestinataire: string;
  dateDebutSouhaitee?: string;
  dateFinSouhaitee?: string;
}

export interface Colis {
  id: string;
  nom: string;
  poidsKg: number;
  quantite: number;
  prixProposeMRU: number;
  statut: ColisStatut;
  villeDepart: string;
  villeArrivee: string;
  nomDestinataire: string;
  numDestinataire: string;
  dateDebutSouhaitee?: string;
  dateFinSouhaitee?: string;
  trajetId?: string;
  paid?: boolean;
  userEmail?: string;
}

// ─── Trajet ───────────────────────────────────────────────────────────────────

export interface TrajetRequest {
  origine: string;
  destination: string;
  dateDepart: string;
  capaciteKg: number;
}

export interface Trajet {
  id: string;
  origine: string;
  destination: string;
  dateDepart: string;
  capaciteKg: number;
  statut: TrajetStatut;
  voyageurEmail: string;
  colis?: Colis[];
}

// ─── Paiement ─────────────────────────────────────────────────────────────────

export interface Paiement {
  id: string;
  montantMRU: number;
  statut: StatutPaiement;
  typePaiement: TypePaiement;
  referenceTransaction: string;
  dateConfirmation?: string;
  commissionAdmin: number;
  montantVoyageur: number;
}

// ─── GPS ──────────────────────────────────────────────────────────────────────

export interface GpsLocation {
  id: string | null;
  colisId: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  message: string;
  statut: StatutNotification;
  type: TypeNotification;
  dateEnvoi: string;
}

// ─── Photo ────────────────────────────────────────────────────────────────────

export interface PhotoColis {
  id: string;
  url: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  colisId: string;
  senderEmail: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO';
  fileUrl?: string;
  timestamp: string;
  createdAt?: string; // backend sets this via LocalDateTime.now() on send
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalColis: number;
  totalTrajets: number;
  totalUsers?: number;
  revenue?: number;
}


// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  validationErrors?: Record<string, string>;
}
