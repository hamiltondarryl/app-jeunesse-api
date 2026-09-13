import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

type OfficerLike = {
  nom?: string | null;
  email?: string | null;
};

type OrganisationMailPayload = {
  nom: string;
  sigle?: string | null;
  commune?: string | null;
  activated?: boolean;
  responsable?: OfficerLike | null;
  secretaireGeneral?: OfficerLike | null;
  tresorier?: OfficerLike | null;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendInscriptionReceived(organisation: OrganisationMailPayload) {
    const recipients = this.collectEmails(organisation);
    if (!recipients.length) {
      this.logger.warn(`Aucun e-mail pour notifier l’inscription de ${organisation.nom}`);
      return;
    }

    await this.send({
      to: recipients,
      subject: `Dossier reçu — ${organisation.nom}`,
      html: this.layout({
        eyebrow: 'Inscription enregistrée',
        title: 'Nous avons bien reçu votre dossier',
        intro: `Bonjour ${organisation.responsable?.nom || 'Madame, Monsieur'},`,
        body: `Le dossier de <strong>${this.escape(organisation.nom)}</strong>${
          organisation.sigle ? ` (${this.escape(organisation.sigle)})` : ''
        } a été transmis à la Direction générale de la jeunesse. Il sera examiné avant publication sur la carte publique.`,
        details: [
          ['Association', organisation.nom],
          ['Sigle', organisation.sigle || '—'],
          ['Commune', organisation.commune || '—'],
          ['Statut', 'En examen'],
        ],
        footer: 'Vous recevrez un nouvel e-mail dès que le dossier sera validé.',
      }),
    });
  }

  async sendAssociationValidated(organisation: OrganisationMailPayload) {
    const recipients = this.collectEmails(organisation);
    if (!recipients.length) {
      this.logger.warn(`Aucun e-mail pour notifier la validation de ${organisation.nom}`);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    await this.send({
      to: recipients,
      subject: `Association validée — ${organisation.nom}`,
      html: this.layout({
        eyebrow: 'Dossier validé',
        title: 'Votre association est désormais visible',
        intro: `Bonjour ${organisation.responsable?.nom || 'Madame, Monsieur'},`,
        body: `Bonne nouvelle : <strong>${this.escape(organisation.nom)}</strong> a été validée par l’administration. Elle apparaît maintenant sur la plateforme publique.`,
        details: [
          ['Association', organisation.nom],
          ['Sigle', organisation.sigle || '—'],
          ['Commune', organisation.commune || '—'],
          ['Statut', 'Publiée'],
        ],
        ctaLabel: 'Voir la plateforme',
        ctaUrl: frontendUrl,
        footer: 'Merci de contribuer au recensement des associations de jeunesse.',
      }),
    });
  }

  private collectEmails(organisation: OrganisationMailPayload): string[] {
    return [
      organisation.responsable?.email,
      organisation.secretaireGeneral?.email,
      organisation.tresorier?.email,
    ]
      .map((email) => email?.trim().toLowerCase())
      .filter((email, index, list): email is string => Boolean(email) && list.indexOf(email) === index);
  }

  private async send(options: { to: string[]; subject: string; html: string }) {
    try {
      await this.mailerService.sendMail({
        from: process.env.MAIL_FROM || 'Plateforme Jeunesse <from@example.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      });
    } catch (error) {
      this.logger.error(`Échec d’envoi d’e-mail : ${options.subject}`);
      this.logger.error(error);
    }
  }

  private layout(params: {
    eyebrow: string;
    title: string;
    intro: string;
    body: string;
    details: Array<[string, string]>;
    ctaLabel?: string;
    ctaUrl?: string;
    footer: string;
  }): string {
    const rows = params.details
      .map(
        ([label, value]) => `
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:13px;width:140px;">${this.escape(label)}</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;">${this.escape(value)}</td>
        </tr>`,
      )
      .join('');

    const cta = params.ctaUrl
      ? `<p style="margin:28px 0 8px;">
          <a href="${params.ctaUrl}" style="display:inline-block;background:#085b36;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;">
            ${this.escape(params.ctaLabel || 'Ouvrir')}
          </a>
        </p>`
      : '';

    return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f3f6f4;font-family:Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(8,91,54,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#085b36,#0b7a4a);padding:28px 32px;color:#fff;">
              <p style="margin:0 0 8px;letter-spacing:.12em;text-transform:uppercase;font-size:11px;font-family:Arial,sans-serif;">${this.escape(params.eyebrow)}</p>
              <h1 style="margin:0;font-size:28px;line-height:1.25;">${this.escape(params.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 14px;color:#111827;font-size:16px;">${params.intro}</p>
              <p style="margin:0 0 22px;color:#374151;font-size:15px;line-height:1.6;">${params.body}</p>
              <table role="presentation" width="100%" style="background:#f4faf7;border:1px solid #d7e8de;border-radius:14px;padding:8px 18px;">
                ${rows}
              </table>
              ${cta}
              <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">${this.escape(params.footer)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 24px;color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">
              Direction générale de la jeunesse · Plateforme des associations
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private escape(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
