import type {
  Pagination,
} from "./orders";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "LOGIN"
  | "LOGOUT"
  | "PAYMENT_UPDATE"
  | "STOCK_UPDATE";

export interface AuditUser {
  publicId: string;
  name: string;
  email: string;

  role:
    | "ADMIN"
    | "CUSTOMER";
}

export interface AuditLog {
  id: string;

  action: AuditAction;

  entity: string;
  entityId: string | null;

  description: string | null;

  before: unknown | null;
  after: unknown | null;

  ipAddress: string | null;
  userAgent: string | null;

  createdAt: string;

  user: AuditUser | null;
}

export interface AuditSummary {
  total: number;
  today: number;

  byAction: Partial<
    Record<
      AuditAction,
      number
    >
  >;
}

export interface AuditLogsResponse {
  success: boolean;
  message: string;

  data: AuditLog[];

  pagination: Pagination;
}

export interface AuditLogResponse {
  success: boolean;
  message: string;

  data: {
    auditLog: AuditLog;
  };
}

export interface AuditSummaryResponse {
  success: boolean;
  message: string;

  data: {
    summary: AuditSummary;
  };
}