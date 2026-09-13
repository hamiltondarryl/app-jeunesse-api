import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export const REFERENTIEL_CATEGORIES = [
  'TYPE_ORGANISATION',
  'SITUATION_PROFESSIONNELLE',
  'SITUATION_MATRIMONIALE',
  'PUBLIC_CIBLE',
] as const;

export class CreateReferentielDto {
  @ApiProperty({ enum: REFERENTIEL_CATEGORIES })
  @IsIn(REFERENTIEL_CATEGORIES)
  categorie: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  libelle: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordre?: number;
}
