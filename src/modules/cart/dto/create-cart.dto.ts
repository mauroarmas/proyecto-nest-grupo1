import { IsUUID, IsNumber } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";    
import { IsNotEmpty, IsArray } from "class-validator";

export class CreateCartDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsNotEmpty()
  cartLines: CreateCartLineDto[];
}

export class CreateCartLineDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
