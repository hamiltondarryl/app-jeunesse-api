// search-department.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDepartmentDto {
  @ApiPropertyOptional({ description: 'Terme de recherche' })
  @IsOptional()
  @IsString()
  searchQuery?: string = '';

  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre d\'éléments par page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}