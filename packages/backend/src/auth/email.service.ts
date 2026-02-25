import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransporter({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmailVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.configService.get('APP_URL')}/verify-email?token=${token}`;
    
    const template = this.loadTemplate('email-verification');
    const html = template({
      verificationUrl,
      appName: this.configService.get('APP_NAME'),
    });

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Verify Your Email',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${token}`;
    
    const template = this.loadTemplate('password-reset');
    const html = template({
      resetUrl,
      appName: this.configService.get('APP_NAME'),
    });

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Reset Your Password',
      html,
    });
  }

  async sendOrderConfirmationEmail(email: string, orderData: any) {
    const template = this.loadTemplate('order-confirmation');
    const html = template({
      orderData,
      appName: this.configService.get('APP_NAME'),
    });

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Order Confirmation',
      html,
    });
  }

  async sendShippingNotificationEmail(email: string, shippingData: any) {
    const template = this.loadTemplate('shipping-notification');
    const html = template({
      shippingData,
      appName: this.configService.get('APP_NAME'),
    });

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Your Order Has Been Shipped',
      html,
    });
  }

  private loadTemplate(templateName: string): handlebars.TemplateDelegate {
    const templatePath = join(__dirname, '..', 'templates', `${templateName}.hbs`);
    const templateSource = readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
  }
}