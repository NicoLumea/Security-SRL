/** Future backend contracts; no runtime implementations or fake connections. */
export type StaffRole = 'ADMIN' | 'EMPLOYEE';
export type ProjectStatus = 'draft' | 'published' | 'archived';
export interface StaffPrincipal {
  id: string;
  role: StaffRole;
  status: 'pending' | 'active' | 'disabled';
}
export interface ProjectRecord {
  id: string;
  categoryId: string;
  status: ProjectStatus;
  featured: boolean;
  displayOrder: number;
  coverMediaId: string | null;
  approvedLocation: string | null;
  confirmedCompletionDate: string | null;
  createdAt: string;
  updatedAt: string;
  lastEditorId: string;
  translations: Record<
    string,
    { title: string; slug: string; description: string; seoTitle: string; seoDescription: string }
  >;
  // Public content must be a reviewed projection, never an arbitrary DB row.
  publicationApproved: boolean;
}
export interface MediaRecord {
  id: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: Record<string, string>;
  status: 'quarantine' | 'approved';
  uploadedBy: string;
}
export interface PortfolioRepository {
  listPublished(
    locale: string,
    cursor?: string,
  ): Promise<{ items: ProjectRecord[]; nextCursor?: string }>;
  saveDraft(principal: StaffPrincipal, record: ProjectRecord): Promise<void>;
  publish(principal: StaffPrincipal, id: string): Promise<void>;
}
export interface MediaService {
  createUpload(
    principal: StaffPrincipal,
    file: { name: string; type: string; size: number },
  ): Promise<{ uploadId: string }>;
  approve(principal: StaffPrincipal, mediaId: string): Promise<void>;
}
export interface MailTransport {
  send(
    template: 'activation' | 'password-reset' | 'inquiry',
    recipient: string,
    data: Record<string, string>,
    idempotencyKey: string,
  ): Promise<{ status: 'queued' | 'disabled' }>;
}
export function canPublish(principal: StaffPrincipal | null) {
  return principal?.status === 'active' && principal.role === 'ADMIN';
}
