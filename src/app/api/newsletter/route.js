import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Basic email validation
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }

    // Save to database
    const signup = await prisma.newsletterSignup.create({
      data: { email },
    });

    // Send welcome email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to NovusMode Newsletter!",
      html: `
        <!DOCTYPE html>
<html>
  <body style="background:#f8faf7;padding:0;margin:0;">
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8faf7;min-height:100vh;padding:0;margin:0;">
      <tr>
        <td align="center" style="padding:32px 0;">
          <table cellpadding="0" cellspacing="0" width="100%" style="max-width:420px;background:white;border-radius:18px;box-shadow:0 4px 24px 0 #e9f5e0;padding:32px 20px 32px 20px;">
            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:14px;">
                <a href="${process.env.NEXT_BASE_URL}" target="_blank">
                  <img src="${
                    process.env.NEXT_BASE_URL
                  }/logo.png" alt="NovusMode" style="width:84px;height:84px;border-radius:24px;display:block;border:2px solid #17103c;">
                </a>
              </td>
            </tr>
            <!-- Heading -->
            <tr>
              <td align="center" style="font-family:sans-serif;color:#17103c;">
                <h2 style="margin:8px 0 0 0;font-size:1.7rem;font-weight:900;letter-spacing:1px;">Welcome to <span style="color:#6ccf4e;">NovusMode</span>!</h2>
                <div style="font-size:1.1rem;font-weight:600;letter-spacing:.2px;margin:0 0 14px 0;color:#17103c;">You’re on the list for exclusive deals & style!</div>
              </td>
            </tr>
            <!-- Coupon and Offer -->
            <tr>
              <td align="center" style="padding:12px 0;">
                <div style="font-size:1.08rem;color:#3e5335;font-weight:500;margin-bottom:10px;">As a thank you, here’s <b>₹200 off</b> your first order!</div>
                <div style="display:inline-block;background:#6ccf4e;color:#fff;padding:12px 32px 12px 32px;font-size:1.4rem;letter-spacing:2px;font-weight:bold;border-radius:32px;box-shadow:0 1px 6px 0 #bde8b4;margin-bottom:10px;">
                  WELCOME200
                </div>
                <div style="font-size:1rem;color:#4d6537;margin-top:10px;">
                  <a href="${
                    process.env.NEXT_BASE_URL
                  }/shop" style="color:#fff;background:#17103c;padding:10px 30px;border-radius:24px;text-decoration:none;font-weight:600;display:inline-block;margin-top:12px;">
                    Start Shopping &rarr;
                  </a>
                </div>
              </td>
            </tr>
            <!-- Info -->
            <tr>
              <td align="center" style="font-size:1rem;color:#37532e;font-family:sans-serif;padding-top:18px;">
                <p style="margin:0 0 8px 0;">
                  You’ll get early access to sales, new drops, and exclusive offers.<br>
                  We only send style, never spam!
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:0.9rem;color:#999;padding-top:12px;">
                <hr style="margin-bottom:8px;">
                <div>
                  If you did not subscribe, just ignore this email.<br>
                  &copy; NovusMode ${new Date().getFullYear()}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>

      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // If duplicate email, Prisma throws unique constraint error
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "You are already subscribed!" },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
