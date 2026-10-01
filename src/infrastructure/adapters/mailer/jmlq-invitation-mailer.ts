import "server-only";

import type {
  InvitationEmailInput,
  InvitationEmailResult,
  InvitationMailer,
} from "@/src/application/family/ports";
import { sendParentInvitationEmail } from "@/app/infrastructure/adapters/jmlq/mailer";

/** Adapter that exposes the current JMLQ mailer through the Family port. */
export class JmlqInvitationMailer implements InvitationMailer {
  /**
   * Sends an invitation through the configured JMLQ mailer.
   *
   * @param input - Email recipient, content URL and expiration values.
   * @returns The provider-generated message identifier.
   */
  send(input: InvitationEmailInput): Promise<InvitationEmailResult> {
    return sendParentInvitationEmail({
      recipientEmail: input.recipientEmail,
      parentName: input.parentName,
      kidName: input.kidName,
      activationLink: input.invitationUrl,
      expiresAt: input.expiresAt,
    });
  }
}
