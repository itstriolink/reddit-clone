import { Box, Flex, Link } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { Button } from "@chakra-ui/button";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
    const [{ data, fetching }] = useMeQuery();
    let body;
    if (fetching) {
        body = null;
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2}>login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link>register</Link>
                </NextLink>
            </>
        );
    } else {
        body = (
            <Flex>
                <Box mr={2}>{data.me.username}</Box>
                <Button
                    variant="link"
                    onClick={() => logout()}
                    isLoading={logoutFetching}
                >
                    logout
                </Button>
            </Flex>
        );
    }

    return (
        <Flex bg="tan" p={4} ml={"auto"}>
            <Box ml={"auto"}>{body}</Box>
        </Flex>
    );
};

export default NavBar;
