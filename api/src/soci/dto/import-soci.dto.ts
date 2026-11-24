import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RigaSocioItem {
  @IsInt() @Min(1) riga!: number;
  @IsString() @MaxLength(100) cognome!: string;
  @IsString() @MaxLength(100) nome!: string;
  @IsOptional() @IsInt() @Min(1) numero_tessera?: number | null;
}

export class ConfermaImportSociDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => RigaSocioItem)
  righe!: RigaSocioItem[];

  /** id dei soci in uscita mostrati nell'anteprima: devono coincidere con quelli ricalcolati */
  @IsArray() @IsInt({ each: true })
  rimuovi_ids!: number[];
}
