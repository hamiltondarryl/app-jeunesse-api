import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ActivateOrganisationDto {
  @ApiPropertyOptional({
    description: 'Statut souhaité. Si omis, le statut actuel est inversé.',
  })
  @IsOptional()
  @IsBoolean()
  activated?: boolean;
}
