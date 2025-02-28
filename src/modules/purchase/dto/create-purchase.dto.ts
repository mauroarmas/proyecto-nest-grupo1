import {
    IsArray,
    IsNotEmpty,
    IsUUID,
    IsPositive,
    IsNumber,
  } from 'class-validator';
  
  export class CreatePurchaseLineDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;
  
    @IsPositive()
    @IsNotEmpty()
    quantity: number;
  
    @IsNumber()
    @IsNotEmpty()
    subtotal: number;
  }
  
  export class CreatePurchaseDto {

    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsUUID()
    @IsNotEmpty()
    supplierId: string;

    @IsArray()
    @IsNotEmpty()
    purchaseLines: CreatePurchaseLineDto[];

  }