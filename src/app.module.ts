import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Counter } from './model/counter.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      autoLoadModels: true,
      synchronize: true,
      models: [Counter],
    }),
    SequelizeModule.forFeature([Counter])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
