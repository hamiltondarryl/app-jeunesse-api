import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OrganisationCommentDto {
  @ApiPropertyOptional({ description: 'Motif ou commentaire de l’action' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le motif doit contenir au moins 8 caractères' })
  @MaxLength(500, { message: 'Le motif ne peut pas dépasser 500 caractères' })
  commentaire?: string;
}

export class OrganisationVisibilityDto {
  @ApiProperty({ description: 'Motif obligatoire de la mise en visibilité ou du retrait' })
  @IsString({ message: 'Le motif est obligatoire' })
  @MinLength(8, { message: 'Le motif doit contenir au moins 8 caractères' })
  @MaxLength(500, { message: 'Le motif ne peut pas dépasser 500 caractères' })
  commentaire: string;
}
