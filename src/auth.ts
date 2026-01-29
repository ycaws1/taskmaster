import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (
                    credentials?.username === process.env.APP_USERNAME &&
                    credentials?.password === process.env.APP_PASSWORD
                ) {
                    return { id: "1", name: "Admin User", email: "admin@example.com" }
                }
                return null
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth
        },
    },
})
