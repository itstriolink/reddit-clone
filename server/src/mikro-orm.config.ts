import { __prod__ } from './constants';
import { Post } from './entities/Post';
import { MikroORM } from '@mikro-orm/core';
import path from 'path';
import { User } from './entities/User';

export default {
    entities: [Post, User],
    dbName: 'lireddit',
    type: 'postgresql',
    user: 'postgres',
    password: 'postgres',
    debug: !__prod__,
    migrations: {
        path: path.join(__dirname, './migrations'),
        pattern: /^[\w-]+\d+\.[tj]s$/
    }
} as Parameters<typeof MikroORM.init>[0];
