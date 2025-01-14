export function VectorColumnType(dimension: number) {
  return {
    type: 'vector',
    
    toSql(): string {
      return `vector(${dimension})`;
    },

    parse(value: any): number[] | null {
      if (value === null) return null;
      return value;
    },

    create(): void {},
    
    prepare(value: any): any {
      return value;
    },

    normalize(value: any): number[] | null {
      return value;
    },

    compare(): boolean {
      return false;
    },

    convertToJSValue(value: any): number[] | null {
      return this.parse(value);
    },

    convertToDatabaseValue(value: any): any {
      return value;
    }
  };
} 