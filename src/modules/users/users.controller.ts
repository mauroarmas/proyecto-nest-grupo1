import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginationArgs } from 'src/utils/pagination/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/constants';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @Get()
  findAll(@Query() pagination: PaginationArgs) {
    return this.usersService.findAll(pagination);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @ApiOperation({ summary: 'Get user by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @ApiOperation({ summary: 'Update user by id' })
  @ApiBody({ type: UpdateUserDto })
  @Roles(RoleEnum.USER, RoleEnum.SUPERADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @ApiOperation({ summary: 'Delete user by id' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Roles(RoleEnum.SUPERADMIN, RoleEnum.USER)
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiBody({ type: UpdateUserDto })
  @Roles(RoleEnum.USER, RoleEnum.SUPERADMIN)
  @Post('profile-img')
  @UseInterceptors(FileInterceptor('file',{limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const { userId } = req.user;
    const result = await this.usersService.uploadFile(userId, updateUserDto, file);

    if (!result || !result.user) {
      throw new Error('File upload failed');
    }

    return {
      profileImg: result.user.profileImg,
      message: result.message, 
    };
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Generate an Excel file with all users' })
  @Get('export/excel')
  findAllByProfessionalExcel(@Res() res: Response, @Req() req) {
    const { userId } = req.user;
    return this.usersService.exportAllExcel(res, userId);
  }

  @Roles(RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Upload users from an Excel file' })
  @Post('upload/excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUsers(@UploadedFile() file: Express.Multer.File) {
    const data = await this.usersService.uploadUsers(file.buffer, file.originalname);
    return data;
  }


  @Roles(RoleEnum.USER, RoleEnum.SUPERADMIN)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @Roles(RoleEnum.USER)
  @Patch('profile/:id')
  updateProfile(@Req() req, @Body() updateProfile: UpdateProfileDto) {
    const { userId } = req.user;
    return this.usersService.updateProfile(userId, updateProfile);
  }
}
