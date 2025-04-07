export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team"; // Import the Team model
import { getToken, GetUserType } from "@/utils/token";

export async function GET(req: NextRequest) {
  try {
    // Extract token from request
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    // Ensure only Admins can access this specific list
    if (!userType || userType !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Only Admins can view this list.",
        },
        { status: 403 }
      );
    }

    // Connect to MongoDB using Mongoose
    await connectToDatabase();

    // --- Step 1: Get all UserIds that are in any team ---

    // Get all distinct user IDs from the teamLeader arrays across all teams
    const leaderIds = await Team.distinct("teamLeader");
    // Get all distinct user IDs from the members arrays across all teams
    const memberIds = await Team.distinct("members");

    // Combine the lists and create a Set for uniqueness
    const combinedIds = [...leaderIds, ...memberIds];
    const uniqueIdsSet = new Set(combinedIds);

    // Convert the Set back to an Array
    const userIdsInTeams = Array.from(uniqueIdsSet); // <-- Fix applied here

    // --- Step 2: Fetch users not in the list ---

    // Fetch users with userType "User" whose UserId is NOT in the userIdsInTeams array
    const usersNotInTeams = await User.find({
      userType: "User",
      UserId: { $nin: userIdsInTeams }, // $nin means "not in"
    });

    // Return the filtered list of users
    return NextResponse.json({ success: true, users: usersNotInTeams });
  } catch (error) {
    console.error("Error fetching users not in teams:", error);
    // Provide a more specific error message if possible
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch users not in teams. Error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
