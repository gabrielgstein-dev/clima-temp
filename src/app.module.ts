import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TempoController } from './clima/clima.controller';

@Module({
  imports: [HttpModule],
  controllers: [AppController, TempoController],
  providers: [AppService],
})
export class AppModule {}
