import type {
  User,
  PatientProfile,
  DoctorProfile,
  Consultation,
  Payment,
  Message,
  Prescription,
  FollowUp,
  Role,
  ConsultationStatus,
  PaymentStatus,
  PaymentMethod,
  MessageType,
} from "@prisma/client";

// ─── Re-exports do Prisma ─────────────────────────────────────────────────────
export type {
  Role,
  ConsultationStatus,
  PaymentStatus,
  PaymentMethod,
  MessageType,
};

// ─── Tipos compostos ──────────────────────────────────────────────────────────

export type UserWithProfile = User & {
  patientProfile: PatientProfile | null;
  doctorProfile:  DoctorProfile  | null;
};

export type ConsultationWithParties = Consultation & {
  patient: User;
  doctor:  User | null;
  payment: Payment | null;
};

export type ConsultationFull = ConsultationWithParties & {
  messages:     Message[];
  prescription: Prescription | null;
  followUps:    FollowUp[];
};

export type MessageWithSender = Message & {
  sender: Pick<User, "id" | "name" | "avatarUrl" | "role">;
};

// ─── DTOs de resposta API ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data:    T;
  message?: string;
}

export interface ApiError {
  message: string;
  code:    string;
  status:  number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

// ─── Parâmetros de paginação ──────────────────────────────────────────────────

export interface PaginationParams {
  page?:   number;
  limit?:  number;
  search?: string;
}

// ─── SSE (Server-Sent Events) ─────────────────────────────────────────────────

export type SSEEventType =
  | "message"
  | "consultation:status"
  | "consultation:started"
  | "consultation:ended"
  | "user:joined"
  | "user:left"
  | "ping";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:        string;
  content:   string;
  type:      MessageType;
  sender: {
    id:        string;
    name:      string;
    avatarUrl: string | null;
    role:      Role;
  };
  createdAt: Date;
  readAt:    Date | null;
}

// ─── Asaas ────────────────────────────────────────────────────────────────────

export interface AsaasCharge {
  id:            string;
  customer:      string;
  value:         number;
  netValue:      number;
  status:        string;
  billingType:   string;
  dueDate:       string;
  invoiceUrl:    string;
  bankSlipUrl:   string | null;
  pixQrCodeImage: string | null;
  pixCopiaECola:  string | null;
}

export interface AsaasCustomer {
  id:      string;
  name:    string;
  email:   string;
  cpfCnpj: string;
  phone?:  string;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface PatientDashboardStats {
  totalConsultations:     number;
  upcomingConsultations:  number;
  completedConsultations: number;
  totalSpent:             number;
}

export interface DoctorDashboardStats {
  totalConsultations:    number;
  todayConsultations:    number;
  pendingConsultations:  number;
  totalRevenue:          number;
  averageRating:         number;
}

export interface AdminDashboardStats {
  totalUsers:          number;
  totalDoctors:        number;
  totalPatients:       number;
  totalConsultations:  number;
  totalRevenue:        number;
  pendingPayments:     number;
}
