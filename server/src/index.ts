import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true
        })
    );

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redisClient,
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: "lax", // csrf
                secure: false // cookie only works in https
            },
            saveUninitialized: false,
            secret: "asdlkjasdijsdoijszxcasddo",
            resave: false
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver]
        }),
        context: ({ req, res }): MyContext => ({
            em: orm.em,
            req,
            res
        }),
        plugins: [
            ApolloServerPluginLandingPageGraphQLPlayground({
                settings: {
                    "request.credentials": "include"
                }
            })
        ]
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({ app, cors: false });

    app.listen(4000, () => {
        console.log("Server started listening locally on port 4000");
    });
};

main().catch(err => console.error(err));
