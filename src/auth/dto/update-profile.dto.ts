import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: "Nom d'affichage" })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  username: string;

  @ApiProperty({ description: 'Adresse e-mail' })
  @IsEmail()
  email: string;
}
