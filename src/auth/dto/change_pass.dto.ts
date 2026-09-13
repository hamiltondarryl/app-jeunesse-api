import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsNotEmpty, IsOptional, MinLength } from "class-validator"

export class ChangePassDto {
    @ApiProperty({ description: "L'ancien mot de passe", type: String })
    @IsNotEmpty()
    old_password : string

    @ApiProperty({ description: 'Le nouveau mot de passe', type: String })
    @IsNotEmpty()
    @MinLength(8)
    new_password : string

    @ApiPropertyOptional({ description: 'Confirmation (alias front)' })
    @IsOptional()
    confirm_new_password?: string

    @ApiPropertyOptional({ description: 'Confirmer le nouveau mot de passe' })
    @IsOptional()
    confirm_password?: string
}