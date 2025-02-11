import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly awsService: AwsService,
    private readonly prisma: PrismaService,
  ) {}
  async create(newUser: CreateUserDto) {
    try {
      const findEmail = await this.prisma.user.findUnique({
        where: { email: newUser.email },
      });
      if (findEmail) {
        throw new Error('This email is already in use');
      }
      const user = await this.prisma.user.create({
        data: {
          ...newUser,
          password: await bcrypt.hash(
            newUser.password,
            process.env.HASH_SALT_ROUND,
          ),
        },
      });
      return { user, message: 'User created successfully' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      return { error: error.message };
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      return user;
    } catch (error) {
      return { error: error.message };
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const findUser = await this.prisma.user.findUnique({ where: { id } });
      if (!findUser) {
        throw new Error('User not found');
      }
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return { user, message: 'User updated successfully' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async remove(id: string) {
    try {
      const findUser = await this.prisma.user.findUnique({ where: { id } });
      if (!findUser) {
        throw new Error('User not found');
      }
      const deletedUser = await this.prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      });
      return { deletedUser, message: 'User deleted successfully' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async uploadFile(
    id: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ) {
    const findUser = await this.prisma.user.findUnique({ where: { id } });
    if (!findUser) {
      throw new Error('User not found');
    }
    const { url, key } = await this.awsService.uploadFile(file, id);
    const user = await this.prisma.user
      .update({
        where: {
          id,
        },
        data: { ...updateUserDto, profileImg: url },
      })
      .catch(async () => {
        await this.awsService.deleteFile(key);
        await this.prisma.user.update({
          where: {
            id,
          },
          data: { profileImg: null },
        });
      });
    return {
      user,
      Message: 'File uploaded successfully',
    };
  }
}
