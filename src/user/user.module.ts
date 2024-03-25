import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EmailModule } from 'src/email/email.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserSchema } from './user.schema';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    EmailModule,
  ],
  controllers: [UserController],
  providers: [UserService, EmailService],
})
export class UserModule {}
