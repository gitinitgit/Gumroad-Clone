import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getReceiptTemplate, ReceiptTemplateData } from '../templates/receipt.template';

class EmailServiceClass {
  private transporter: nodemailer.Transporter | null = null;
  private isTestAccount = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // If credentials exist, use them
      if (env.EMAIL_USER && env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          host: env.EMAIL_HOST,
          port: env.EMAIL_PORT,
          secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
          auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASS,
          },
        });
        logger.info(`Email service initialized with SMTP host: ${env.EMAIL_HOST}`);
      } else {
        // Fallback to Ethereal (fake email for development)
        logger.warn('No EMAIL_USER or EMAIL_PASS provided in env. Falling back to Ethereal Email for testing.');
        const testAccount = await nodemailer.createTestAccount();
        this.isTestAccount = true;
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        logger.info(`Ethereal test account created: ${testAccount.user}`);
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendPurchaseReceipt(to: string, data: ReceiptTemplateData) {
    if (!this.transporter) {
      logger.error('Cannot send email, transporter not initialized');
      return;
    }

    try {
      const html = getReceiptTemplate(data);
      
      const info = await this.transporter.sendMail({
        from: `Gumroad Clone <${env.EMAIL_FROM}>`,
        to,
        subject: `Receipt for ${data.productName} (Order #${data.orderId.slice(-8)})`,
        html,
      });

      logger.info(`Receipt email sent to ${to}. MessageId: ${info.messageId}`);
      
      if (this.isTestAccount) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      logger.error('Failed to send receipt email:', error);
    }
  }
}

export const EmailService = new EmailServiceClass();
