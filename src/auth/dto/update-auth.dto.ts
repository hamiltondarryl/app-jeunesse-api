import { PartialType } from '@nestjs/swagger';
import { LoginAdminDto } from './login-admin.dto';

export class UpdateAuthDto extends PartialType(LoginAdminDto) {}
