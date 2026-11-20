export const CATEGORIAS = [
  'Filosofia Grega & Clássica',
  'Filosofia Moderna & Pós-Moderna',
  'História',
  'Geopolítica',
  'Tecnologia & Computação',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
