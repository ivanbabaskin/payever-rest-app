import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ProducerService } from '../queues/producer.service';
import { HttpService } from '@nestjs/axios';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './user.schema';
import * as fs from 'fs';

class UserModelMock {
  static findOne = jest.fn();
  save = jest.fn();
}

class HttpServiceMock {
  axiosRef = {
    get: jest.fn(),
  };
}

class ProducerServiceMock {
  addToEmailQueue = jest.fn();
}

describe('UserService', () => {
  let service: UserService;
  let httpService: HttpServiceMock;
  let producerService: ProducerServiceMock;
  let unlinkSyncMock: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: HttpService, useClass: HttpServiceMock },
        { provide: ProducerService, useClass: ProducerServiceMock },
        { provide: getModelToken(User.name), useValue: UserModelMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    httpService = module.get<HttpServiceMock>(HttpService);
    producerService = module.get<ProducerServiceMock>(ProducerService);
    unlinkSyncMock = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };
      UserModelMock.findOne.mockResolvedValueOnce(null);

      const result = await service.createUser(userData);

      expect(result).toBeDefined();
      expect(producerService.addToEmailQueue).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };
      UserModelMock.findOne.mockResolvedValueOnce(userData as User);

      await expect(service.createUser(userData)).rejects.toThrow(
        'Failed to create user',
      );
    });
  });

  describe('getUser', () => {
    it('should get user data', async () => {
      const userId = '1';
      const responseData = {
        data: { id: userId, first_name: 'John', last_name: 'Doe' },
      };
      httpService.axiosRef.get.mockResolvedValueOnce({ data: responseData });

      const result = await service.getUser(userId);

      expect(result).toEqual(responseData.data);
    });

    it('should throw error if failed to get user data', async () => {
      const userId = '1';
      const errorMessage = 'Failed to fetch user data';
      httpService.axiosRef.get.mockRejectedValueOnce(new Error(errorMessage));

      await expect(service.getUser(userId)).rejects.toThrowError(
        `Failed to get user: ${errorMessage}`,
      );
    });
  });

  describe('deleteUserAvatar', () => {
    it('should delete user avatar', async () => {
      const userId = '1';
      const userData = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        avatar: 'avatar.jpg',
        save: jest.fn(),
      };
      UserModelMock.findOne.mockResolvedValueOnce(userData);

      const deletedUser = await service.deleteUserAvatar(userId);

      expect(deletedUser.avatar).toBeNull();
      expect(fs.unlinkSync).toHaveBeenCalledWith(`avatars/avatar.jpg`);
    });

    it('should handle user with no avatar', async () => {
      const userId = '2';
      const userData = {
        id: 2,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        save: jest.fn(),
      };
      UserModelMock.findOne.mockResolvedValueOnce(userData);

      const deletedUser = await service.deleteUserAvatar(userId);

      expect(deletedUser.avatar).toBeNull();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should throw error if failed to delete user avatar', async () => {
      const userId = '3';
      const userData = {
        id: 3,
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        avatar: 'avatar.jpg',
      };
      UserModelMock.findOne.mockResolvedValueOnce(userData as User);
      unlinkSyncMock.mockImplementationOnce(() => {
        throw new Error('Failed to delete file');
      });

      await expect(service.deleteUserAvatar(userId)).rejects.toThrowError(
        'Failed to delete user avatar: Failed to delete file',
      );
    });
  });
});
