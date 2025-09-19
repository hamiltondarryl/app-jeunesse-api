import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
export class CreateProvinceDto {

    @ApiProperty({ description: "Nom de la province", type: String })
    @IsString()
    @IsNotEmpty()
    nom: string;

    @ApiProperty({ description: "Abréviation de la province", type: String })
    @IsString()
    @IsNotEmpty()
    abreviation: string;
}
