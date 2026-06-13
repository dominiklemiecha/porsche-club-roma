import { IsInt, Max, Min } from 'class-validator';

export class CreateAnnoDto {
  @IsInt() @Min(2000) @Max(2100) anno!: number;
}
