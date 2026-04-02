import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, UploadedFiles, BadRequestException, UseInterceptors, Query } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { CreateOrganisationDto, PublicCreateOrganisationDto } from './dto/create-organisation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/guards/permissions.decorator';



@ApiTags("Gestion des organisations")
@Controller('organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) { }

  @ApiOperation({ summary: "Soumettre une nouvelle inscription d'organisation" })
  @ApiResponse({ status: 201, description: 'Inscription soumise avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou fichiers manquants' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: "Formulaire d'inscription d'organisation avec fichiers",
    type: PublicCreateOrganisationDto,
  })
  @Post('inscription')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'recepice', maxCount: 1 },
    { name: 'pieceIdentiteResponsable', maxCount: 1 },
    { name: 'pieceIdentiteSecretaireGeneral', maxCount: 1 },
    { name: 'pieceIdentiteTresorier', maxCount: 1 },
    { name: 'recepiceProvisoirOuDefinitif', maxCount: 1 }
  ], {
    storage: diskStorage({
      destination: './uploads/organisations/public',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
        callback(null, filename);
      }
    }),
    fileFilter: (req, file, callback) => {
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedMimes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(`Type de fichier non supporté pour ${file.fieldname}. Types autorisés: JPEG, PNG, PDF`),
          false
        );
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    }
  }))
  async createInscription(
    @Body() createOrganisationDto: PublicCreateOrganisationDto,
    @UploadedFiles() files: {
      recepice?: Express.Multer.File[],
      pieceIdentiteResponsable?: Express.Multer.File[],
      pieceIdentiteSecretaireGeneral?: Express.Multer.File[],
      pieceIdentiteTresorier?: Express.Multer.File[],
      recepiceProvisoirOuDefinitif?: Express.Multer.File[]
    }
  ) {
    // Validation des fichiers

    if (!files.pieceIdentiteResponsable?.[0]) {
      throw new BadRequestException('Le fichier pieceIdentite est obligatoire');
    }

    if (!files.pieceIdentiteSecretaireGeneral?.[0]) {
      throw new BadRequestException('Le fichier pieceIdentite du secretaire general est obligatoire');
    }

    if (!files.pieceIdentiteTresorier?.[0]) {
      throw new BadRequestException('Le fichier pieceIdentite du tresorier est obligatoire');
    }

    if (!files.recepiceProvisoirOuDefinitif?.[0]) {
      throw new BadRequestException('Le fichier recepiceProvisoirOuDefinitif est obligatoire');
    }

    // Parser les données JSON
    let organisationData: CreateOrganisationDto;
    try {
      organisationData = JSON.parse(createOrganisationDto.data);
    } catch {
      throw new BadRequestException('Format de données JSON invalide');
    }

    const result = await this.organisationService.create(organisationData, files);

    return {
      success: true,
      message: 'Organisation créée avec succès',
      data: result,
    };
  }


  @ApiOperation({ summary: "Nombre d'associations par département pour une province avec filtre domaine optionnel" })
  @HttpCode(HttpStatus.OK)
  @Get('stats/departements/:provinceAbreviation')
  async getOrganisationsCountByDepartement(
    @Param('provinceAbreviation') provinceAbreviation: string,
    @Query('domaineId') domaineId?: string
  ) {
    return this.organisationService.getOrganisationsCountByDepartement(provinceAbreviation, domaineId);
  }

  @ApiOperation({ summary: "Recherche d'associations par nom de département" })
  @ApiQuery({
    name: 'searchTerm',
    required: true,
    description: 'Terme de recherche pour les départements'
  })
  @ApiQuery({
    name: 'domaineId',
    required: false,
    description: 'ID du domaine pour filtrer les associations'
  })
  @HttpCode(HttpStatus.OK)
  @Get('recherche/departements')
  async searchOrganisationsByDepartement(
    @Query('searchTerm') searchTerm: string,
    @Query('domaineId') domaineId?: string
  ) {
    return this.organisationService.searchOrganisationsByDepartement(searchTerm, domaineId);
  }


  @ApiOperation({ summary: "Nombre d'associations par province avec filtre domaine optionnel" })
  @HttpCode(HttpStatus.OK)
  @Get('stats/provinces')
  async getOrganisationsCountByProvince(
    @Query('domaineId') domaineId?: string
  ) {
    return this.organisationService.getOrganisationsCountByProvince(domaineId);
  }


  @ApiOperation({ summary: "Récuperation des organisations" })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.organisationService.findAll();
  }

  @ApiOperation({ summary: "Récuperation des organisations avec filtre" })
  @HttpCode(HttpStatus.OK)
  @Get('search')
  search(@Param('page') page: number, @Param('limit') limit: number, @Query('activated') activated: string, @Param('searchQuery') searchQuery: string,) {
    return this.organisationService.search(page, limit, activated, searchQuery,);
  }


  @ApiOperation({ summary: "Récuperation des organisations avec filtre" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LIST_ORGANISATION') // La permission requise
  @HttpCode(HttpStatus.OK)
  @Get('searchPrivate')
  searchPrivate(@Param('page') page: number, @Param('limit') limit: number, @Query('activated') activated: string, @Param('searchQuery') searchQuery: string) {
    return this.organisationService.search(page, limit, activated, searchQuery);
  }

  @ApiOperation({ summary: "Récuperation des organisations par domaine" })
  @HttpCode(HttpStatus.OK)
  @Get('domaines/:id')
  findByDomaines(@Param('id') id: string) {
    return this.organisationService.findByDomaineId(id);
  }
  @ApiOperation({ summary: "Récuperation des organisations par province" })
  @HttpCode(HttpStatus.OK)
  @Get('provinces/:id')
  findByProvinces(@Param('id') id: string) {
    return this.organisationService.findByProvinceId(id);
  }

  @ApiOperation({ summary: "Récuperation d'une organisation" })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organisationService.findOne(id);
  }

  @ApiOperation({ summary: "Mise à jour d'une organisation" })
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrganisationDto: UpdateOrganisationDto) {
    const result = await this.organisationService.update(id, updateOrganisationDto);
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.organisationService.remove(id);
  }

  @ApiOperation({ summary: "Activation d'une organisation" })
  @HttpCode(HttpStatus.OK)
  @Patch('activate/:id')
  activate(@Param('id') id: string) {
    return this.organisationService.activeOrganisation(id);
  }
}
