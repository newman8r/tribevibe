import { ValueTransformer } from 'typeorm';

export class VectorTransformer implements ValueTransformer {
  to(value: number[] | null): number[] | null {
    if (value === null) return null;
    if (Array.isArray(value)) return value;
    return null;
  }

  from(value: number[] | null): number[] | null {
    if (value === null) return null;
    if (Array.isArray(value)) return value;
    return null;
  }
} 