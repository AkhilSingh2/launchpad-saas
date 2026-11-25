export function inviteIsOpen(
  invite: { status: string; expiresAt: Date },
  now = new Date(),
) {
  return invite.status === "pending" && invite.expiresAt.getTime() > now.getTime();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
