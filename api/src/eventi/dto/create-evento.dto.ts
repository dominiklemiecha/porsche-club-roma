import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';
import { Categoria } from '@prisma/client';

export class CreateEventoDto {
  @IsString() @MaxLength(200) titolo!: string;
  @IsDateString() data_evento!: string;
  @IsEnum(Categoria) categoria!: Categoria;
  @IsInt() @Min(0) punteggio_base!: number;
  @IsBoolean() prova_abilita!: boolean;
  @ValidateIf(o => o.prova_abilita === true)
  @IsArray() @IsInt({ each: true }) @IsOptional()
  scala_prova?: number[];
}
