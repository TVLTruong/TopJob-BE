export class EmployerCategoryDto {
  id: string;
  name: string;
  slug: string;

  constructor(partial: Partial<EmployerCategoryDto>) {
    Object.assign(this, partial);
  }
}
