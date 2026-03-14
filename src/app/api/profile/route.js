// File: /app/api/profile/route.js

import { getServerSession } from "next-auth";
import { authOptions } from "@/scripts/authOptions";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      email: true,
      phone: true,
      gender: true,
      dob: true,
    },
  });

  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify(user), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const { name, email, phone, dob, gender } = await req.json();

  // Basic validations
  if (!name || !email || !dob || !gender) {
    return new Response(
      JSON.stringify({ message: "Missing required fields" }),
      { status: 400 }
    );
  }

  const parsedDOB = new Date(dob);
  if (isNaN(parsedDOB.getTime())) {
    return new Response(JSON.stringify({ message: "Invalid date format" }), {
      status: 400,
    });
  }

  try {
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        email,
        phone,
        gender,
        dob: parsedDOB,
      },
    });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
