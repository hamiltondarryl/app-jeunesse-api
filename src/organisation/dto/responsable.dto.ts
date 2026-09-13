import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ResponsableDto {
  @ApiProperty({ description: 'Nom', required: false })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  nom?: string;

  @ApiProperty({ description: 'Âge', required: false })
  @IsOptional()
  @IsInt({ message: 'L’âge doit être un nombre entier' })
  @Min(15, { message: 'L’âge minimum est 15 ans' })
  @Max(120, { message: 'L’âge maximum est 120 ans' })
  age?: number;

  @ApiProperty({ description: 'Nationalité', required: false })
  @IsOptional()
  @IsString({ message: 'La nationalité est invalide' })
  nationalite?: string;

  @ApiProperty({ description: 'Situation professionnelle', required: false })
  @IsOptional()
  @IsString({ message: 'La situation professionnelle est invalide' })
  situation?: string;

  @ApiProperty({ description: 'Situation matrimoniale', required: false })
  @IsOptional()
  @IsString({ message: 'La situation matrimoniale est invalide' })
  situationMatrimoniale?: string;

  @ApiProperty({ description: 'Téléphone', required: false })
  @IsOptional()
  @IsString({ message: 'Le téléphone est invalide' })
  telephone?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email?: string;

  @ApiProperty({ description: 'Adresse', required: false })
  @IsOptional()
  @IsString({ message: 'L’adresse est invalide' })
  adresse?: string;
}
