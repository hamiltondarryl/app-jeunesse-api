import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty } from "class-validator"

export class ResetPassDto {
    @ApiProperty({ description: "Le code recu par mail", type: String })
    @IsNotEmpty()
    code : string

    @ApiProperty({ description: 'Le nouveau mot de passe', type: String })
    @IsNotEmpty()
    new_password : string

    @ApiProperty({ description: 'Le nouveau mot de passe', type: String })
    @IsNotEmpty()
    confirm_password : string
}