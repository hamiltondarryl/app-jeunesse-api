import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty } from "class-validator"

export class ResetPassDto {
    @ApiProperty({ description: "Le code de réinitialisation reçu par mail", type: String })
    @IsNotEmpty()
    code : string

    @ApiProperty({ description: 'Le nouveau mot de passe', type: String })
    @IsNotEmpty()
    new_password : string

    @ApiProperty({ description: 'Confirmer le nouveau mot de passe', type: String })
    @IsNotEmpty()
    confirm_password : string
}