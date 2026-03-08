import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getDb, toCamel } from "@/lib/db";
import { verifyPassword, verifyOneTimeToken } from "@/lib/auth";
import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        role?: string;
        status?: string;
    }
}

export const authConfig: NextAuthConfig = {
    trustHost: true,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const email = (credentials.email as string).trim();
                const password = credentials.password as string;

                // Stack Auth one-time token exchange
                if (email === "__stack__") {
                    const parsed = verifyOneTimeToken(password);
                    if (!parsed) return null;
                    const sql = getDb();
                    const rows = await sql`SELECT id, email, name, role, status FROM users WHERE id = ${parsed.userId}`;
                    if (rows.length === 0) return null;
                    const dbUser = rows[0] as Record<string, unknown>;
                    if (dbUser.status === "suspended" || dbUser.status === "deactivated") return null;
                    return {
                        id: dbUser.id as string,
                        email: dbUser.email as string,
                        name: dbUser.name as string,
                        role: dbUser.role as string,
                        status: dbUser.status as string,
                    };
                }

                const emailNorm = email.toLowerCase().trim();
                const sql = getDb();
                const rows = await sql`SELECT * FROM users WHERE email = ${emailNorm}`;
                if (rows.length === 0) return null;

                const dbUser = rows[0] as Record<string, unknown>;
                if (dbUser.status === "suspended" || dbUser.status === "deactivated") {
                    throw new Error("Account is suspended or deactivated");
                }

                const passwordValid = await verifyPassword(password, dbUser.password_hash as string);
                if (!passwordValid) return null;

                return {
                    id: dbUser.id as string,
                    email: dbUser.email as string,
                    name: dbUser.name as string,
                    role: dbUser.role as string,
                    status: dbUser.status as string,
                };
            }
        })
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.status = user.status;
            }

            // Impersonation logic handling from session updates
            if (trigger === "update" && session && session.impersonateUser) {
                token.originalUserId = token.originalUserId || token.id;
                token.id = session.impersonateUser.id;
                token.role = session.impersonateUser.role;
                token.isImpersonating = true;
            }

            if (trigger === "update" && session && session.stopImpersonating) {
                token.id = token.originalUserId;
                token.role = "admin";
                token.isImpersonating = false;
                token.originalUserId = undefined;
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.status = token.status as string;
                // @ts-ignore
                session.user.isImpersonating = !!token.isImpersonating;
            }
            return session;
        }
    },
    session: { strategy: "jwt" }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
