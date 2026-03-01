import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PriceModule } from './price/price.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PriceModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'db',
      port: parseInt(process.env.DATABASE_PORT as string) || 5432,
      username: process.env.DATABASE_USER || 'aley',
      password: process.env.DATABASE_PASSWORD || 'supersecretpassword',
      database: process.env.DATABASE_NAME || 'nest_db',
      synchronize: true, // only for dev
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
