import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ProducerService } from '../queues/producer.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { UserDto } from './user.interface';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private producerService: ProducerService,
    private readonly httpService: HttpService,
  ) {}

  async createUser(userData: UserDto): Promise<UserDto> {
    try {
      const origUser = await this.userModel.findOne({ id: userData.id });
      if (origUser)
        throw new Error(`User with id ${userData.id} already exist`);

      const newUser = new this.userModel({
        first_name: userData.first_name,
        last_name: userData.last_name,
        id: userData.id,
        email: userData.email,
      });

      const emailData = {
        email: userData.email,
        subject: 'Welcome to Our Community',
        html: `<p>Hello ${userData.first_name},</p>
        <p>Welcome to our community! Your account is now active.</p>
        <p>Enjoy your time with us!</p>`,
      };
      await this.producerService.addToEmailQueue(JSON.stringify(emailData));

      await newUser.save();
      return newUser;
    } catch (e) {
      throw new Error(`Failed to create user: ${e.message}`);
    }
  }

  async getUser(userId: string): Promise<UserDto> {
    try {
      const response = await this.httpService.axiosRef.get(
        `https://reqres.in/api/users/${userId}`,
      );
      const userData = response.data.data;
      return userData;
    } catch (e) {
      throw new Error(`Failed to get user: ${e.message}`);
    }
  }

  async getUserAvatar(userId: string): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.get(
        `https://reqres.in/api/users/${userId}`,
      );
      const avatarURL = response.data.data.avatar;

      const userData = await this.userModel.findOne({ id: userId });
      let imagePath = '';
      if (userData.avatar) imagePath = `avatars/${userData.avatar}`;
      else {
        const imageResponse = await this.httpService.axiosRef.get(avatarURL, {
          responseType: 'arraybuffer',
        });
        const hash = crypto
          .createHash('sha256')
          .update(imageResponse.data)
          .digest('hex');
        const avatar = `${userId}_${hash}.jpg`;
        imagePath = `avatars/${avatar}`;

        fs.writeFileSync(imagePath, imageResponse.data);

        userData.avatar = avatar;
        await userData.save();
      }
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      return base64Image;
    } catch (e) {
      throw new Error(`Failed to get user avatar: ${e.message}`);
    }
  }

  async deleteUserAvatar(userId: string): Promise<UserDto> {
    try {
      const userData = await this.userModel.findOne({ id: userId });

      if (userData.avatar) {
        const imagePath = `avatars/${userData.avatar}`;
        fs.unlinkSync(imagePath); // Delete the file
      }

      userData.avatar = null;
      await userData.save();
      return userData;
    } catch (e) {
      throw new Error(`Failed to delete user avatar: ${e.message}`);
    }
  }
}
