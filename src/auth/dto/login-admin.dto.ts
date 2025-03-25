import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty } from "class-validator"

export class LoginAdminDto {
    @ApiProperty({ description: "L'adresse mail )", type: String })
    @IsNotEmpty()
    @IsEmail()
    email : string

    @ApiProperty({ description: 'Le mot de passe', type: String })
    @IsNotEmpty()
    password : string
}
