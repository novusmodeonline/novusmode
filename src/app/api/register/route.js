import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { parseDateFromDDMMYYYY } from "@/scripts/utils";

import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { name, email, password, phone, dob, gender, termsAccepted } =
      await request.json();
    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = "400";
      throw error;
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error("This email is already registered");
      error.statusCode = "400";
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedDOB = parseDateFromDDMMYYYY(dob);
    if (isNaN(parsedDOB.getTime())) {
      const error = new Error("Date of birth is invalid");
      error.statusCode = "400";
      throw error;
    }

    if (phone.length != 10) {
      const error = new Error("Phone Number must have 10 digits");
      error.statusCode = "400";
      throw error;
    }
    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "USER",
        name,
        phone,
        dob: parsedDOB,
        gender: gender === "" ? null : gender,
        termsAccepted,
      },
    });

    return new Response(JSON.stringify(newUser), { status: 200 });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    return new Response(JSON.stringify({ message }), { status });
  }
}
