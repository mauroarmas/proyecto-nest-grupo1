import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCategorySupplierDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}

export class CreateSupplierDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty()
  @IsString()
  taxId: string;

  @IsNotEmpty()
  @IsArray()
  categories: CreateCategorySupplierDto[];
}
