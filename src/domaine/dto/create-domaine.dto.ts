import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateDomaineDto {
   @ApiProperty({ description: 'La dénomination du domaine ', type: String })
    @IsNotEmpty()
    name : string
}
