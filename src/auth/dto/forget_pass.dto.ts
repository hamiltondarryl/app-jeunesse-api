import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty } from "class-validator"

export class ForgetPassDto {
    @ApiProperty({ description: "L'adresse mail", type: String })
    @IsNotEmpty()
    @IsEmail()
    email : string
}