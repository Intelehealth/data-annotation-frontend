import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

// In-memory user storage (replace with your preferred storage method)
const users = [
  {
    id: "1",
    email: "demo@example.com",
    password: "demo123", // In production, use hashed passwords
    name: "Demo User",
    firstName: "Demo",
    lastName: "User"
  }
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = users.find(
          (user) => user.email === credentials.email && user.password === credentials.password
        );

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    signUp: "/signup",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-here",
});

// Helper function to add a new user (for signup)
export async function addUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const newUser = {
    id: (users.length + 1).toString(),
    ...userData,
    name: `${userData.firstName} ${userData.lastName}`
  };
  
  users.push(newUser);
  return newUser;
}

// Helper function to check if email already exists
export function emailExists(email: string) {
  return users.some(user => user.email === email);
}
