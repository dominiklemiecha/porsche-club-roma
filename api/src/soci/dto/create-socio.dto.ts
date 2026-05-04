import { IsInt, IsString, MaxLength, Min } from 'class-validator';
export class CreateSocioDto {
  @IsInt() @Min(1) numero_tessera!: number;
  @IsString() @MaxLength(100) nome!: string;
  @IsString() @MaxLength(100) cognome!: string;
}
