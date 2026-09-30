import { ready, pool } from '../src/lib/db';
ready().then(() => { console.log('migrated'); return pool().end(); });
