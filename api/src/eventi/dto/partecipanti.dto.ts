import { IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PartecipanteItem {
  @IsInt() socio_id!: number;
  @IsOptional() @IsInt() @Min(1) posizione_prova?: number;
}

export class SetPartecipantiDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => PartecipanteItem)
  partecipanti!: PartecipanteItem[];
}
