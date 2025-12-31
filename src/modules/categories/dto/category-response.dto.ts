// src/modules/categories/dto/category-response.dto.ts
export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}
