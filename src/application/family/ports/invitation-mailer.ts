/** Values required to deliver a parent invitation email. */
export type InvitationEmailInput = {
  /** Destination email address. */
  recipientEmail: string;
  /** Parent name displayed in the email. */
  parentName: string;
  /** Kid name displayed in the invitation context. */
  kidName: string;
  /** Absolute URL containing the invitation token. */
  invitationUrl: string;
  /** Invitation expiration instant. */
  expiresAt: Date;
};

/** Result returned after an invitation email is accepted by the provider. */
export type InvitationEmailResult = {
  /** Provider-generated message identifier. */
  messageId: string;
};

/** Mail provider capability required by invitation use cases. */
export interface InvitationMailer {
  /**
   * Sends an invitation email.
   *
   * @param input - Recipient, content and expiration values for the email.
   * @returns The provider message identifier.
   */
  send(input: InvitationEmailInput): Promise<InvitationEmailResult>;
}
