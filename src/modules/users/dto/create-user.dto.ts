import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: 'this field is required'})
    @IsString({ message: 'this field must be a string'})
    @MinLength(3, { message: 'this field must be at least 3 characters'})
    @MaxLength(30, { message: 'this field must be at most 30 characters'})
    name: string;

    @IsNotEmpty({ message: 'this field is required'})
    @IsString({ message: 'this field must be a string'})
    @MinLength(3, { message: 'this field must be at least 3 characters'})
    @MaxLength(30, { message: 'this field must be at most 30 characters'})
    lastName: string;

    @IsNotEmpty({ message: 'this field is required'})
    @IsString({ message: 'this field must be a string'})
    @MinLength(5, { message: 'this field must be at least 5 digits'})
    @MaxLength(20, { message: 'this field must be at most 20 digits'})
    phone: string;

    @IsNotEmpty({ message: 'this field is required'})
    @IsEmail({},{ message: 'this field must be a valid email'})
    email: string;

    @IsNotEmpty({ message: 'this field is required'})
    @IsString({ message: 'this field must be a string'})
    @MinLength(8, { message: 'this field must be at least 8 characters'})
    @MaxLength(30, { message: 'this field must be at most 30 characters'})
    password: string;

    @IsNotEmpty({ message: 'this field is required'})
    @IsString({ message: 'this field must be a string'})
    @MinLength(10, { message: 'this field must be at least 10 characters'})
    @MaxLength(100, { message: 'this field must be at most 100 characters'})
    address: string;

    profileImg?: string;
}


export class UpdateUserDto extends PartialType(CreateUserDto) {}

