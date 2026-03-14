// Shared TypeScript types for the PDF Summarizer application

/**
 * Subscription status values — mirrors what is stored as strings in SQLite.
 * SQLite does not support Prisma native enums; we use string constants instead.
 */
export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  CANCELED: 'CANCELED',
  PAST_DUE: 'PAST_DUE',
  TRIALING: 'TRIALING',
  INACTIVE: 'INACTIVE',
} as const;

export type SubscriptionStatusType =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscriptionStatus?: string | null;
}

/** Response returned by the /api/upload endpoint */
export interface UploadResponse {
  text: string;
  charCount: number;
  truncated: boolean;
}

/** Response returned by the /api/summarize endpoint */
export interface SummarizeResponse {
  summary: string;
}

/** Error response returned when a subscription is required */
export interface SubscriptionRequiredError {
  error: string;
  upgradeUrl: string;
}

/** Response returned by the /api/stripe/checkout endpoint */
export interface CheckoutResponse {
  url: string;
}

/** Response returned by the /api/stripe/portal endpoint */
export interface PortalResponse {
  url: string;
}

/** A summary record as returned from the dashboard query */
export interface SummaryRecord {
  id: string;
  filename: string;
  extractedText: string;
  summary: string;
  createdAt: Date;
}
