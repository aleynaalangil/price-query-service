import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PriceRecord {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  symbol: string;
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;
  @Column()
  lastUpdate: Date;
}
