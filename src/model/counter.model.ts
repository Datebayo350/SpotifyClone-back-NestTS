import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class Counter extends Model {
  @Column
  value: number;
}
