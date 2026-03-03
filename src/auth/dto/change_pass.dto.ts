import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty } from "class-validator"

export class ChangePassDto {
    @ApiProperty({ description: "L'ancien mot de passe", type: String })
    @IsNotEmpty()
    old_password : string

    @ApiProperty({ description: 'Le nouveau mot de passe', type: String })
    @IsNotEmpty()
    new_password : string

    @ApiProperty({ description: 'Confirmer le nouveau mot de passe', type: String })
    @IsNotEmpty()
    confirm_password : string
}