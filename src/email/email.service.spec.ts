import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send an email', async () => {
      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML Content</p>',
      };

      // Mock the sendMail method of MailerService
      jest.spyOn(mailerService, 'sendMail').mockResolvedValueOnce('Email Sent');

      const result = await service.sendEmail(emailOptions);

      expect(result).toEqual('Email Sent');
    });

    it('should throw internal server error if sending email fails', async () => {
      const emailOptions = {
        email: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML Content</p>',
      };

      // Mock the sendMail method of MailerService to throw an error
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValueOnce(new Error('Sending Failed'));

      try {
        await service.sendEmail(emailOptions);
        // If the code reaches this point, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toEqual('Error');
        expect(error.getStatus()).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });
});
