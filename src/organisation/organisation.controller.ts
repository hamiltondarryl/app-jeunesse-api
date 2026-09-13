import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UploadedFiles,
  BadRequestException,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { DocumentKey, OfficerRole, OrganisationService } from './organisation.service';
import { flattenValidationErrors } from 'src/common/validation-errors';
import { ResponsableDto } from './dto/responsable.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { CreateOrganisationDto, PublicCreateOrganisationDto } from './dto/create-organisation.dto';
import { ActivateOrganisationDto } from './dto/activate-organisation.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from '../auth/guards/permissions.decorator';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Gestion des organisations')
@Controller('organisation')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @ApiOperation({ summary: "Soumettre une nouvelle inscription d'organisation" })
  @ApiResponse({ status: 201, description: 'Inscription soumise avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou fichiers manquants' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: "Formulaire d'inscription d'organisation avec fichiers",
    type: PublicCreateOrganisationDto,
  })
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('inscription')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'recepice', maxCount: 1 },
        { name: 'pieceIdentiteResponsable', maxCount: 1 },
        { name: 'pieceIdentiteSecretaireGeneral', maxCount: 1 },
        { name: 'pieceIdentiteTresorier', maxCount: 1 },
        { name: 'recepiceProvisoirOuDefinitif', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/organisations/public',
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, callback) => {
          const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
          if (!allowedMimes.includes(file.mimetype)) {
            return callback(
              new BadRequestException(
                `Type de fichier non supporté pour ${file.fieldname}. Types autorisés: JPEG, PNG, PDF`,
              ),
              false,
            );
          }
          callback(null, true);
        },
        limits: {
          fileSize: 5 * 1024 * 1024,
        },
      },
    ),
  )
  async createInscription(
    @Body() createOrganisationDto: PublicCreateOrganisationDto,
    @UploadedFiles()
    files: {
      recepice?: Express.Multer.File[];
      pieceIdentiteResponsable?: Express.Multer.File[];
      pieceIdentiteSecretaireGeneral?: Express.Multer.File[];
      pieceIdentiteTresorier?: Express.Multer.File[];
      recepiceProvisoirOuDefinitif?: Express.Multer.File[];
    },
  ) {
    if (!files?.pieceIdentiteResponsable?.[0]) {
      throw new BadRequestException('La pièce d’identité du responsable est obligatoire');
    }
    if (!files?.pieceIdentiteSecretaireGeneral?.[0]) {
      throw new BadRequestException('La pièce d’identité du secrétaire général est obligatoire');
    }
    if (!files?.pieceIdentiteTresorier?.[0]) {
      throw new BadRequestException('La pièce d’identité du trésorier est obligatoire');
    }
    if (!files?.recepiceProvisoirOuDefinitif?.[0]) {
      throw new BadRequestException('Le récépissé provisoire ou définitif est obligatoire');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(createOrganisationDto.data);
    } catch {
      throw new BadRequestException('Format de données JSON invalide');
    }

    const organisationData = plainToInstance(CreateOrganisationDto, parsed);
    const errors = await validate(organisationData, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Données d’inscription invalides',
        errors: flattenValidationErrors(errors),
      });
    }

    const result = await this.organisationService.create(organisationData, files);

    return {
      success: true,
      message: 'Inscription enregistrée. Elle sera visible après validation par l’administration.',
      data: {
        id: result.id,
        nom: result.nom,
        activated: result.activated,
      },
    };
  }

  @ApiOperation({ summary: 'Mettre à jour un membre du bureau' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_ORGANISATION')
  @Patch(':id/officers/:role')
  async updateOfficer(
    @Param('id') id: string,
    @Param('role') role: OfficerRole,
    @Body() body: ResponsableDto,
  ) {
    if (!['responsable', 'secretaireGeneral', 'tresorier'].includes(role)) {
      throw new BadRequestException({
        message: 'Membre du bureau inconnu',
        errors: { role: 'Le responsable indiqué est invalide' },
      });
    }
    return this.organisationService.updateOfficer(id, role, body);
  }

  @ApiOperation({ summary: 'Ajouter, remplacer ou retirer des documents' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_ORGANISATION')
  @ApiConsumes('multipart/form-data')
  @Patch(':id/documents')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'recepice', maxCount: 1 },
        { name: 'pieceIdentiteResponsable', maxCount: 1 },
        { name: 'pieceIdentiteSecretaireGeneral', maxCount: 1 },
        { name: 'pieceIdentiteTresorier', maxCount: 1 },
        { name: 'recepiceProvisoirOuDefinitif', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/organisations/public',
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, callback) => {
          const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
          if (!allowedMimes.includes(file.mimetype)) {
            return callback(
              new BadRequestException({
                message: `Type de fichier non supporté pour ${file.fieldname}`,
                errors: { [file.fieldname]: 'Types autorisés : JPEG, PNG, PDF' },
              }),
              false,
            );
          }
          callback(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  async updateDocuments(
    @Param('id') id: string,
    @Body('remove') removeRaw: string,
    @UploadedFiles()
    files: {
      recepice?: Express.Multer.File[];
      pieceIdentiteResponsable?: Express.Multer.File[];
      pieceIdentiteSecretaireGeneral?: Express.Multer.File[];
      pieceIdentiteTresorier?: Express.Multer.File[];
      recepiceProvisoirOuDefinitif?: Express.Multer.File[];
    },
  ) {
    const allowed: DocumentKey[] = [
      'recepice',
      'recepiceProvisoirOuDefinitif',
      'pieceIdentiteResponsable',
      'pieceIdentiteSecretaireGeneral',
      'pieceIdentiteTresorier',
    ];
    const remove = String(removeRaw || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item): item is DocumentKey => allowed.includes(item as DocumentKey));

    return this.organisationService.updateDocuments(id, files || {}, remove);
  }

  @ApiOperation({ summary: "Mise à jour d'une organisation" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_ORGANISATION')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrganisationDto: UpdateOrganisationDto) {
    return this.organisationService.update(id, updateOrganisationDto);
  }

  @ApiOperation({ summary: "Nombre d'associations par département pour une province" })
  @HttpCode(HttpStatus.OK)
  @Get('stats/departements/:provinceAbreviation')
  async getOrganisationsCountByDepartement(
    @Param('provinceAbreviation') provinceAbreviation: string,
    @Query('domaineId') domaineId?: string,
  ) {
    return this.organisationService.getOrganisationsCountByDepartement(
      provinceAbreviation,
      domaineId,
    );
  }

  @ApiOperation({ summary: "Recherche d'associations par département, province ou nom" })
  @ApiQuery({ name: 'searchTerm', required: true })
  @ApiQuery({ name: 'domaineId', required: false })
  @HttpCode(HttpStatus.OK)
  @Get('recherche/departements')
  async searchOrganisationsByDepartement(
    @Query('searchTerm') searchTerm: string,
    @Query('domaineId') domaineId?: string,
  ) {
    return this.organisationService.searchOrganisationsByDepartement(searchTerm, domaineId);
  }

  @ApiOperation({ summary: 'Recherche textuelle publique (nom, sigle, commune, but)' })
  @HttpCode(HttpStatus.OK)
  @Get('recherche/texte')
  async searchPublicText(@Query('q') q: string, @Query('domaineId') domaineId?: string) {
    return this.organisationService.searchPublicText(q, domaineId);
  }

  @ApiOperation({ summary: 'Suggestions d’associations pour l’autocomplétion publique' })
  @HttpCode(HttpStatus.OK)
  @Get('recherche/suggestions')
  suggestPublic(@Query('q') q: string) {
    return this.organisationService.suggestPublic(q);
  }

  @ApiOperation({ summary: "Nombre d'associations par province" })
  @HttpCode(HttpStatus.OK)
  @Get('stats/provinces')
  async getOrganisationsCountByProvince(@Query('domaineId') domaineId?: string) {
    return this.organisationService.getOrganisationsCountByProvince(domaineId);
  }

  @ApiOperation({ summary: 'Organisations validées (données publiques)' })
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.organisationService.findAllPublic();
  }

  @ApiOperation({ summary: 'Recherche publique des organisations validées' })
  @HttpCode(HttpStatus.OK)
  @Get('search')
  search(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('activated') activated = 'true',
    @Query('searchQuery') searchQuery = '',
  ) {
    return this.organisationService.search(Number(page), Number(limit), activated, searchQuery, true);
  }

  @ApiOperation({ summary: 'Recherche privée (espace admin)' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('LIST_ORGANISATION')
  @HttpCode(HttpStatus.OK)
  @Get('searchPrivate')
  searchPrivate(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('activated') activated = 'true',
    @Query('searchQuery') searchQuery = '',
  ) {
    return this.organisationService.search(
      Number(page),
      Number(limit),
      activated,
      searchQuery,
      false,
    );
  }

  @ApiOperation({ summary: 'Organisations par domaine (validées)' })
  @HttpCode(HttpStatus.OK)
  @Get('domaines/:id')
  findByDomaines(@Param('id') id: string) {
    return this.organisationService.findByDomaineId(id, true);
  }

  @ApiOperation({ summary: 'Organisations par province (validées)' })
  @HttpCode(HttpStatus.OK)
  @Get('provinces/:id')
  findByProvinces(@Param('id') id: string) {
    return this.organisationService.findByProvinceId(id, true);
  }

  @ApiOperation({ summary: "Détail d'une organisation (admin)" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('READ_ORGANISATION')
  @HttpCode(HttpStatus.OK)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.organisationService.findOne(id, false);
  }

  @ApiOperation({ summary: "Détail public d'une organisation validée" })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organisationService.findOne(id, true);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('DELETE_ORGANISATION')
  async remove(@Param('id') id: string) {
    return this.organisationService.remove(id);
  }

  @ApiOperation({ summary: "Valider, publier ou retirer une organisation" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('UPDATE_ORGANISATION')
  @HttpCode(HttpStatus.OK)
  @Patch('activate/:id')
  activate(@Param('id') id: string, @Body() body: ActivateOrganisationDto) {
    return this.organisationService.activeOrganisation(id, body?.activated);
  }
}
