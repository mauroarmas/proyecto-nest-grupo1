import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AwsService } from '../aws/aws.service';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { Prisma } from '@prisma/client';
import { getPaginationFilter } from 'src/utils/pagination/pagination.utils';
import { paginate } from 'src/utils/pagination/parsing';

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

  async findAll(pagination: PaginationArgs) {
    try {
      const {search, startDate, endDate, date} = pagination;
      const dateObj = new Date(date);

      const where: Prisma.UserWhereInput = {
        isDeleted: false,
        ...(search && {
          OR: [
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(date && {
          createdAt: {
            gte: new Date(dateObj.setUTCHours(0, 0, 0, 0)),
            lte: new Date(dateObj.setUTCHours(23, 59, 59, 999)),
          },
        }),
        })
      }

      const baseQuery = {
        where,
        ...getPaginationFilter(pagination),
      }
      const total = await this.prisma.user.count({ where });

      const users = await this.prisma.user.findMany(baseQuery);

      const res =paginate( users, total, pagination);
      return res
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
