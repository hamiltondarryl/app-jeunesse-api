import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards, HttpStatus, Req, Query, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/guards/permissions.decorator';


@ApiTags("Gestion des utilisateurs")
@ApiBearerAuth('access-token')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: "Créer un utilisateur" })
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('CREATE_USER')
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Req() req) {
    const user = req.user;
    return await this.userService.create(createUserDto, user.id);
  }

  @ApiOperation({ summary: "Lister les utilisateurs" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LIST_USER') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get()
 async  findAll() {
    return await this.userService.findAll();
  }

  @ApiOperation({ summary: "Rechercher des utilisateurs " })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LIST_USER') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get('search')
  async search(@Query('searchQuery') searchQuery: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,) {
    return await this.userService.search(page, limit, searchQuery);
  }

  @ApiOperation({ summary: "Afficher un utilisateur" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('READ_USER') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get(':id')
 async  findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @ApiOperation({ summary: "Mettre à jour un utilisateur" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_USER') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: "Active/desactiver une utilisateur" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('ACTIVATED_USER')
  @HttpCode(HttpStatus.OK) 
  @Patch(':id/activated')
  async activated(@Param('id') id: string,  @Req() req) {
    const user = req.user;
    return await this.userService.activated(id, user.id);
  }
}
