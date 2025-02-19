import { IsUUID } from "class-validator";
import { IsNotEmpty } from "class-validator";

export class DeleteCartDto {
    @IsUUID()
    @IsNotEmpty()
    id: string;
}