import { DataSource, DataSourceOptions } from 'typeorm';

export class VectorColumnType {
  constructor(private dimension: number) {}

  create(dataSource: DataSource): void {
    dataSource.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
  }

  value = {
    type: 'vector',
    length: this.dimension,
  };
} 