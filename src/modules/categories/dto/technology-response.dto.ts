// src/modules/categories/dto/technology-response.dto.ts
export class TechnologyResponseDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;

  constructor(partial: Partial<TechnologyResponseDto>) {
    Object.assign(this, partial);
  }
}
