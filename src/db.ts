import Dexie, { Table } from 'dexie';

export interface Note {
  id: string;
  content: string;
  updatedAt: number;
}

export interface Bookmark {
  id: string;
  createdAt: number;
}

export class MyDatabase extends Dexie {
  notes!: Table<Note>;
  bookmarks!: Table<Bookmark>;

  constructor() {
    super('ConstitutionDB');
    this.version(1).stores({
      notes: 'id',
      bookmarks: 'id'
    });
  }
}

export const db = new MyDatabase();
