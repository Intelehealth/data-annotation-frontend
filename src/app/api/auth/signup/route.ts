import { NextRequest, NextResponse } from "next/server";
import { addUser, emailExists } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (emailExists(email)) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    // Add new user
    const newUser = await addUser({
      email,
      password, // In production, hash this password
      firstName,
      lastName
    });

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(
      { 
        message: "User created successfully",
        user: userWithoutPassword
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
