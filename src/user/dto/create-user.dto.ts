import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
        @ApiProperty({ description: "Le nom d'utilisateur", type: String })
        @IsString()
        @IsNotEmpty()
        username: string;
    
        @ApiProperty({ description: "L'email de l'utilisateur", type: String })
        @IsString()
        @IsNotEmpty()
        @IsEmail()
        email: string;
        
        @ApiProperty({ description: "Le role de l'utilisateur", type: String })
        @IsString()
        @IsNotEmpty()
        roleId: string;
}
