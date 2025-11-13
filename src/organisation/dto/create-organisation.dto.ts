// create-organisation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from "class-transformer";
import { 
  IsArray, 
  IsBoolean, 
  IsInt, 
  IsNumber, 
  IsOptional, 
  IsString, 
  Min, 
  ValidateNested 
} from "class-validator";

class CreateResponsableDto {
  @ApiProperty({ description: "Nom du responsable" })
  @IsString()
  nom: string;

  @ApiProperty({ description: "Âge du responsable", required: false })
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiProperty({ description: "Nationalité du responsable", required: false })
  @IsOptional()
  @IsString()
  nationalite?: string;

  @ApiProperty({ description: "Situation familiale", required: false })
  @IsOptional()
  @IsString()
  situation?: string;

  @ApiProperty({ description: "Téléphone du responsable", required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ description: "Email du responsable", required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: "Adresse du responsable", required: false })
  @IsOptional()
  @IsString()
  adresse?: string;
}

export class CreateOrganisationDto {
  @ApiProperty({ description: "Nom de l'organisation" })
  @IsString()
  nom: string;

  @ApiProperty({ description: "Sigle de l'organisation", required: false })
  @IsOptional()
  @IsString()
  sigle?: string;

  @ApiProperty({ description: "Type d'organisation", required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: "Année de création", required: false })
  @IsOptional()
  @IsInt()
  @Min(1900)
  anneeCreation?: number;

  @ApiProperty({ description: "Agrément technique délivré" })
  @IsBoolean()
  agrementTechniqueDelivred: boolean | string;

  @ApiProperty({ description: "Adresse de l'organisation", required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ description: "Commune", required: false })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiProperty({ description: "Organisation internationale" })
  @IsBoolean()
  international: boolean;

  @ApiProperty({ description: "Type de récepice", required: false })
  @IsOptional()
  @IsString()
  typeRecepice?: string;

  @ApiProperty({ description: "Nombre de groupes", required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  groupes?: number;

  @ApiProperty({ description: "Nombre d'adhérents", required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  adherents?: number;

  @ApiProperty({ description: "Nombre d'hommes", required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  hommes?: number;

  @ApiProperty({ description: "Nombre de femmes", required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  femmes?: number;

  @ApiProperty({ description: "Nombre de salariés", required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaries?: number;

  @ApiProperty({ description: "Nombre de bénévoles", required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  benevoles?: number;

  @ApiProperty({ description: "Cotisation mensuelle", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cotisationMensuelle?: number;

  @ApiProperty({ description: "A des partenaires" })
  @IsString()
   @IsOptional()
  partenaires?: string;

  @ApiProperty({ description: "But de l'organisation", required: false })
  @IsOptional()
  @IsString()
  but?: string;

  @ApiProperty({ description: "Public cible", required: false })
  @IsOptional()
  @IsString()
  publicCible?: string;

  @ApiProperty({ description: "Liste des domaines d'intervention", type: [String] })
  @IsArray()
  @IsString({ each: true })
  domaines: string[];

  @ApiProperty({ description: "Liste des départements d'intervention", type: [String] })
  @IsArray()
  @IsString({ each: true })
  departements: string[];

  @ApiProperty({ description: "Informations du responsable" })
  @ValidateNested()
  @Type(() => CreateResponsableDto)
  responsable: CreateResponsableDto;
}


// public-create-organisation.dto.ts
export class PublicCreateOrganisationDto {
  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    description: 'Fichier recepice (JPEG, PNG, PDF - max 5MB)' 
  })
  recepice: any;

  @ApiProperty({ 
    type: 'string', 
    format: 'binary',
    description: 'Fichier piece identite (JPEG, PNG, PDF - max 5MB)' 
  })
  pieceIdentite: any;

  @ApiProperty({ 
    description: "Données de l'organisation au format JSON",
    example: `{
  "nom": "Mon Organisation",
  "sigle": "MO",
  "type": "Association",
  "anneeCreation": 2020,
  "agrementTechniqueDelivred": true,
  "adresse": "123 Rue Example",
  "commune": "Ma Commune",
  "international": false,
  "typeRecepice": "Type A",
  "groupes": 5,
  "adherents": 100,
  "hommes": 60,
  "femmes": 40,
  "salaries": 10,
  "benevoles": 20,
  "cotisationMensuelle": 25.5,
  "partenaires": "UNESCO",
  "but": "But de l'organisation",
  "publicCible": "Public cible",
  "domaines": ["uuid-domaine-1", "uuid-domaine-2"],
  "departements": ["uuid-departement-1", "uuid-departement-2"],
  "responsable": {
    "nom": "John Doe",
    "age": 35,
    "nationalite": "Française",
    "situation": "Marié",
    "telephone": "+1234567890",
    "email": "john@example.com",
    "adresse": "456 Rue Responsable"
  }
}`
  })
  @IsString()
  data: string;
}