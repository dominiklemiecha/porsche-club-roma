import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { Categoria } from '@prisma/client';

export class CreateEventoDto {
  @IsString() @MaxLength(200) titolo!: string;
  @IsInt() @Min(2000) @Max(2100) @IsOptional() anno?: number;
  @IsDateString() data_evento!: string;
  @IsDateString() @IsOptional() data_fine?: string;
  @IsEnum(Categoria) categoria!: Categoria;
  @IsInt() @Min(0) punteggio_base!: number;
  @IsBoolean() prova_abilita!: boolean;
  @ValidateIf(o => o.prova_abilita === true)
  @IsArray() @IsInt({ each: true }) @IsOptional()
  scala_prova?: number[];
}
