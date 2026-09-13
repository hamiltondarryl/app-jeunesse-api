import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateReferentielDto } from './create-referentiel.dto';

export class UpdateReferentielDto extends PartialType(CreateReferentielDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
