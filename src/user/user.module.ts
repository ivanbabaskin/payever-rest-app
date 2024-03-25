import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserSchema } from './user.schema';
import { EmailService } from 'src/email/email.service';
import { QueueModule } from 'src/queues/queue.module';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    QueueModule,
  ],
  controllers: [UserController],
  providers: [UserService, EmailService],
})
export class UserModule {}
