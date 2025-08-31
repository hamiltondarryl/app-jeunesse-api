import { PartialType } from '@nestjs/swagger';
import { CreateDomaineDto } from './create-domaine.dto';

export class UpdateDomaineDto extends PartialType(CreateDomaineDto) {}
