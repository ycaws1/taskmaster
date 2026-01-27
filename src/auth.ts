import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
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
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized: async ({ auth }) => {
            console.log("Middleware authorized callback. User:", auth?.user?.email);
            // Logged in users are authenticated, otherwise redirect to login page
            return !!auth
        },
    },
})
