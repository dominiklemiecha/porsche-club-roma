import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
export class CreateSocioDto {
  @IsInt() @Min(1) numero_tessera!: number;
  @IsString() @MaxLength(100) nome!: string;
  @IsString() @MaxLength(100) cognome!: string;
  @IsOptional() @IsString() @MaxLength(150) modello_auto?: string;
}
