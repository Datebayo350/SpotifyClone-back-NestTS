import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { InjectModel } from '@nestjs/sequelize';
import { Counter } from './model/counter.model';

@Controller('/api/albums/last-listened')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectModel(Counter)
    private counterModel: typeof Counter,
  ) {}

  @Get('/count')
  async getCounter() {
    return this.counterModel.count();
  }

  @Get()
  async getLastListened(): Promise<ListenedAlbum[]> {
    const records: ListenedAlbum[] = [];
    const csvFilePath = path.resolve(
      __dirname,
      'data/listened_albums_small.csv',
    );

    const parser = fs.createReadStream(csvFilePath, { encoding: 'utf-8' }).pipe(
      parse({
        delimiter: ';',
        from_line: 2,
        columns: [
          'Id',
          'Album Name',
          'Artist Name',
          'LastListenning',
          'ListenedCount',
        ],
      }),
    );

    for await (const record of parser) {
      const listenAlbum = new ListenedAlbum();
      listenAlbum.id = record.Id;
      listenAlbum.name = record['Album Name'];
      listenAlbum.artistName = record['Artist Name'];
      listenAlbum.listenedCount = record.ListenedCount;
      listenAlbum.lastListened = new Date(record.LastListenning);
      records.push(listenAlbum);
    }
    return records;
  }
}

class ListenedAlbum {
  id: string;
  name: string;
  artistName: string;
  listenedCount: number;
  lastListened: Date;
}
