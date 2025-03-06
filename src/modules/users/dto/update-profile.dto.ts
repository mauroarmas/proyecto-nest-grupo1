import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class UpdateProfileDto {
    @ApiProperty({
        description: 'User biography',
        example: 'I am a software developer',
        required: false
    })
    @IsString({ message: i18nValidationMessage('errors.isString') })
    @MaxLength(255, { message: i18nValidationMessage('errors.maxLength', { value: 255 }) })
    bio?: string;
}