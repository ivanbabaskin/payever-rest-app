import { Controller, Get, Param, Post, Delete, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './user.interface';

@Controller('api')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  createUser(@Body() userData: UserDto): Promise<UserDto> {
    return this.userService.createUser(userData);
  }

  @Get('user/:userId')
  getUser(@Param('userId') userId: string): Promise<UserDto> {
    return this.userService.getUser(userId);
  }

  @Get('user/:userId/avatar')
  getUserAvatar(@Param('userId') userId: string): Promise<string> {
    return this.userService.getUserAvatar(userId);
  }

  @Delete('user/:userId/avatar')
  deleteUserAvatar(@Param('userId') userId: string): Promise<UserDto> {
    return this.userService.deleteUserAvatar(userId);
  }
}
