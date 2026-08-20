import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail = process.env.RESEND_FROM_EMAIL;

  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  }

  async sendMembershipInvitation(to: string, tenantName: string, invitationUrl: string) {
    if (!this.resend || !this.fromEmail) {
      throw new InternalServerErrorException('Le service email Resend n’est pas configuré.');
    }

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: `Invitation à rejoindre ${tenantName}`,
      html: `<p>Vous êtes invité à rejoindre <strong>${tenantName}</strong> sur Workermate.</p><p><a href="${invitationUrl}">Créer votre compte et accepter l’invitation</a></p>`,
    });

    if (error) {
      this.logger.error(`Resend email failed for ${to}: ${error.message}`);
      throw new InternalServerErrorException('Impossible d’envoyer l’invitation par email.');
    }
  }
}
