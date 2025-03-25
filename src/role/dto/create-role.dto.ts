import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRoleDto {

    @ApiProperty({ description: "Le nom du role ", type: String })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: "Le code du role ", type: String })
    @IsString()
    @IsNotEmpty()
    code: string;
    
    @IsOptional()
    @ApiProperty({ description: "La description du role ", type: String })
    @IsString()
    description: string;

    @ApiProperty({ description: "Liste des permissions", type: Array })
    @IsArray()
    @IsNotEmpty()
    readonly permissions: string[]; // Array of permission IDs
}
