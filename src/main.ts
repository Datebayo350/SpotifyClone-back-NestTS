import { NestFactory } from '@nestjs/core';
import sequelize from 'sequelize';
import { AppModule } from './app.module';
import { Counter } from './model/counter.model';
import { Sequelize } from 'sequelize';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['POST', 'PUT', 'DELETE', 'GET'],
    allowedHeaders: 'Content-Type, Accept',
  });


  // This will create an in-memory sqlite db
  const sequelize = new Sequelize('sqlite::memory:');
  await sequelize.sync({ force: true }).then(() => {
    // seed db
    Counter.create({ value: 0 })
  });

  await app.listen(8080);
}
bootstrap();
