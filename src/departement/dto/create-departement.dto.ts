import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateDepartementDto {

    @ApiProperty({ description: "Nom du departement", type: String })
    @IsString()
    @IsNotEmpty()
    nom: string;

    @ApiProperty({ description: "ID de la province associée", type: String })
    @IsString()
    @IsNotEmpty()
    provinceId: string;

}
