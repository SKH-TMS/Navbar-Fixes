// src/app/api/ParticipantDetails/[email]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team"; // Import the Team model
import { getToken, GetUserType } from "@/utils/token";

export async function GET(
  req: NextRequest, // Use NextRequest
  { params }: { params: { UserId: string } }
) {
  try {
    // 1. Authorize Admin
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const requesterUserType = await GetUserType(token);
    if (requesterUserType !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Admin access required to view participant details.",
        },
        { status: 403 }
      );
    }

    // 2. Get Email from params
    const { UserId } = params;
    if (!UserId || typeof UserId !== "string") {
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid UserId parameter." },
        { status: 400 }
      );
    }
    // Normalize UserId for case-insensitive search
    const normalizedEmail = UserId.toLowerCase();

    // 3. Find User by Email
    await connectToDatabase();
    const user = await User.findOne({ UserId });

    if (!user) {
      return NextResponse.json(
        { success: false, message: `User with UserId ${UserId} not found.` },
        { status: 404 }
      );
    }

    // Ensure we have the UserId (should exist if user is found)
    const targetUserId = user.UserId;
    if (!targetUserId) {
      console.error(`User found by UserId ${UserId} but missing UserId.`);
      return NextResponse.json(
        { success: false, message: "Server Error: User data integrity issue." },
        { status: 500 }
      );
    }

    // 4. Find Teams Led by this User
    const teamsLed = await Team.find({ teamLeader: targetUserId })
      .select("teamId teamName members teamLeader") // Select only relevant fields
      .lean();

    // 5. Find Teams where User is a Member (but NOT a Leader)
    const teamsMemberOf = await Team.find({
      members: targetUserId, // User is in the members array
      teamLeader: { $ne: targetUserId }, // User is NOT in the teamLeader array
    })
      .select("teamId teamName members teamLeader") // Select only relevant fields
      .lean();

    return NextResponse.json({
      success: true,
      user,
      teamsLed: teamsLed,
      teamsMemberOf: teamsMemberOf,
    });
  } catch (error) {
    console.error(
      `❌ Error fetching participant details for UserId ${params?.UserId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch participant details. Error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
