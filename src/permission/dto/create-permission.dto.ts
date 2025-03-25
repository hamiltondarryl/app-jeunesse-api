import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePermissionDto {
    @ApiProperty({ description: "Le nom de la permission ", type: String })
    @IsString()
    @IsNotEmpty()
    name: string;
    
    @IsOptional()
    @ApiProperty({ description: "Le nom de la permission ", type: String })
    @IsString()
    description: string;
}
