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
import { ExcelService } from '../excel/excel.service';
import { ExcelColumn } from 'src/common/interfaces';
import { I18nService } from 'nestjs-i18n';
import { translate } from 'src/utils/translation';


@Injectable()
export class UsersService {
  constructor(
    private readonly awsService: AwsService,
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService,
    private readonly i18n: I18nService,
  ) {}
  async create(newUser: CreateUserDto) {
    try {
      const findEmail = await this.prisma.user.findUnique({
        where: { email: newUser.email },
      });
      if (findEmail) {
        throw new Error(translate(this.i18n, "message.existingMail"));
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
      return { user, message: translate(this.i18n, 'messages.userCreated') };
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
      if (!user) {
        throw new Error(translate(this.i18n, 'messages.userNotFound'));
      }
      return user;
    } catch (error) {
      return { error: error.message };
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const findUser = await this.prisma.user.findUnique({ where: { id } });
      if (!findUser) {
        throw new Error(translate(this.i18n, 'messages.userNotFound'));
      }
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return { user, message: translate(this.i18n, 'messages.userUpdated') };
    } catch (error) {
      return { error: error.message };
    }
  }

  async remove(id: string) {
    try {
      const findUser = await this.prisma.user.findUnique({ where: { id } });
      if (!findUser) {
        throw new Error(translate(this.i18n, 'messages.userNotFound'));
      }
      const deletedUser = await this.prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      });
      return { deletedUser, message: translate(this.i18n, 'messages.userDeleted') };
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
      throw new Error(translate(this.i18n, 'messages.userNotFound'));
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
      Message: translate(this.i18n, 'messages.profileImg')
    };
  }

  async exportAllExcel(res: Response, userId: string) {
    const users = await this.prisma.user.findMany({ where: {isDeleted: false}, include: {profile: true}});

    const columns: ExcelColumn[] = [
      { header: 'name', key: 'name' },
      { header: 'lastName', key: 'lastName' },
      { header: 'email', key: 'email' },
      { header: 'phone', key: 'phone' },
      { header: 'address', key: 'address' },
      { header: 'profileImg', key: 'profileImg' },
      { header: 'password', key: 'password' },
    ];

    const workbook = await this.excelService.generateExcel(
      users,
      columns,
      'Usuarios',
    );

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const file: Express.Multer.File = {
      fieldname: 'excel-usuarios',
      originalname: 'usuarios.xlsx',
      encoding: '7bit',
      mimetype:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.length,
      buffer,
      destination: '',
      filename: '',
      path: '',
      stream: null,
    };

    const { url } = await this.awsService.uploadFile(file, 'excel');
    const reportUrl = url;

    await this.prisma.report.create({
      data: { reportUrl },
    });
   await this.excelService.exportToResponse(res, workbook, 'usuarios.xlsx');
}

async uploadUsers(buffer: Buffer) {
  const users = await this.excelService.readExcel(buffer);
  
  const emails= users.map((user) => user.email);
  
  const existingEmails = await this.prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  
  const usersToCreate = users.filter((user) => !existingEmails.some(({ email }) => email === user.email));
  
  if (usersToCreate.length > 0) {
    await this.prisma.user.createMany({ data: usersToCreate });
  } else {
    return {
      messsage: translate(this.i18n, 'messages.noUsersToCreate')
    }
  }
  return {
    users,
    message: translate(this.i18n, 'messages.uploadUsers')
  };
}
}
