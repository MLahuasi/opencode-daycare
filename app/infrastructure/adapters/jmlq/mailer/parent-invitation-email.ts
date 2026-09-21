import "server-only";

import { EmailAddress } from "@jmlq/mailer";
import { APP_LOCALE } from "@/app/shared";
import { getMailer } from "./mailer.singleton";

const PARENT_INVITATION_SUBJECT = "Activa tu acceso a OpenDayCare";
const PARENT_INVITATION_TEMPLATE_ID = "parent-invitation";

/** Values required to send a parent account-activation invitation. */
export type ParentInvitationEmailInput = {
  /** Destination email address. */
  recipientEmail: string;
  /** Parent name displayed in the message. */
  parentName: string;
  /** Kid name displayed in the invitation context. */
  kidName: string;
  /** Absolute HTTP or HTTPS account-activation URL. */
  activationLink: string;
  /** Invitation expiration instant. */
  expiresAt: Date;
};

/** Result returned after the invitation is accepted by the mail transport. */
export type ParentInvitationEmailResult = {
  /** Provider-generated message identifier. */
  messageId: string;
};

type ParentInvitationTemplateData = {
  parentName: string;
  kidName: string;
  activationLink: string;
  expiresAt: string;
};

type PreparedParentInvitationEmail = {
  recipientEmail: string;
  templateData: ParentInvitationTemplateData;
  textBody: string;
};

const EXPIRATION_DATE_FORMATTER = new Intl.DateTimeFormat(APP_LOCALE, {
  dateStyle: "long",
  timeZone: "UTC",
});

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

function normalizeActivationLink(activationLink: string): string {
  let parsedLink: URL;

  try {
    parsedLink = new URL(activationLink);
  } catch {
    throw new Error("[mailer] activationLink must be an absolute HTTP or HTTPS URL");
  }

  if (parsedLink.protocol !== "http:" && parsedLink.protocol !== "https:") {
    throw new Error("[mailer] activationLink must use HTTP or HTTPS");
  }

  return parsedLink.toString();
}

function formatExpirationDate(expiresAt: Date): string {
  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
    throw new Error("[mailer] expiresAt must be a valid Date");
  }

  return EXPIRATION_DATE_FORMATTER.format(expiresAt);
}

/**
 * Validates and prepares parent-invitation values for HTML and plain text.
 *
 * @param input - Parent invitation values.
 * @param input.recipientEmail - Destination email address.
 * @param input.parentName - Parent name displayed in the message.
 * @param input.kidName - Kid name displayed in the invitation context.
 * @param input.activationLink - Absolute HTTP or HTTPS activation URL.
 * @param input.expiresAt - Invitation expiration instant.
 * @returns Sanitized template data and the plain-text alternative.
 */
export function prepareParentInvitationEmail(
  input: ParentInvitationEmailInput,
): PreparedParentInvitationEmail {
  const activationLink = normalizeActivationLink(input.activationLink);
  const expiresAt = formatExpirationDate(input.expiresAt);

  return {
    recipientEmail: input.recipientEmail.trim(),
    templateData: {
      parentName: escapeHtml(input.parentName),
      kidName: escapeHtml(input.kidName),
      activationLink: escapeHtml(activationLink),
      expiresAt: escapeHtml(expiresAt),
    },
    textBody: [
      `Hola ${input.parentName},`,
      "",
      `Has sido invitado para acceder a la información de ${input.kidName} en OpenDayCare.`,
      `Activa tu cuenta antes del ${expiresAt}:`,
      activationLink,
    ].join("\n"),
  };
}

/**
 * Sends an account-activation invitation to a parent.
 *
 * @param input - Parent invitation values.
 * @param input.recipientEmail - Destination email address.
 * @param input.parentName - Parent name displayed in the message.
 * @param input.kidName - Kid name displayed in the invitation context.
 * @param input.activationLink - Absolute HTTP or HTTPS activation URL.
 * @param input.expiresAt - Invitation expiration instant.
 * @returns The provider-generated message identifier.
 */
export async function sendParentInvitationEmail(
  input: ParentInvitationEmailInput,
): Promise<ParentInvitationEmailResult> {
  const preparedEmail = prepareParentInvitationEmail(input);
  const recipient = EmailAddress.from(preparedEmail.recipientEmail);
  const result = await getMailer().send({
    to: recipient,
    subject: PARENT_INVITATION_SUBJECT,
    templateId: PARENT_INVITATION_TEMPLATE_ID,
    templateData: preparedEmail.templateData,
    textBody: preparedEmail.textBody,
  });

  return { messageId: result.messageId };
}
