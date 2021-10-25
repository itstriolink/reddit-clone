import { User } from "../entities/User";
import { MyContext } from "../types";
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver
} from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME } from "../constants";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { em, req }: MyContext) {
        if (!req.session!.userId) {
            return null;
        }

        return await em.findOne(User, { id: req.session!.userId });
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") { username, password }: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if (username.length <= 4) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Length must be greater than 4"
                    }
                ]
            };
        }

        if (password.length <= 6) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Length must be greater than 6"
                    }
                ]
            };
        }

        const user = em.create(User, {
            username: username,
            password: await argon2.hash(password)
        });

        try {
            await em.persistAndFlush(user);
        } catch (error) {
            if (error.code === "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "This username has already been taken"
                        }
                    ]
                };
            }

            console.log("message: ", error);
        }

        req.session!.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") { username, password }: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username });
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "This username does not exist"
                    }
                ]
            };
        }

        const valid = await argon2.verify(user.password, password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "The password is incorrect"
                    }
                ]
            };
        }

        req.session!.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise(resolve =>
            req.session?.destroy(error => {
                if (error) {
                    console.log(error);
                    resolve(false);
                    return;
                }

                res.clearCookie(COOKIE_NAME);
                resolve(true);
            })
        );
    }
}
