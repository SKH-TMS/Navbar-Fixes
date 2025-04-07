import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import { getToken, GetUserId, GetUserType } from "@/utils/token";

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    // Authenticate the request
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    // Verify that the requester is a Project Manager
    const userType = await GetUserType(token);
    if (userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access, you are not a Project Manager.",
        },
        { status: 401 }
      );
    }

    // Get the current user's ID
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. User ID not found, please login again.",
        },
        { status: 401 }
      );
    }

    // Connect to MongoDB and get teamId from params
    await connectToDatabase();
    const { teamId } = params;

    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Team ID is required." },
        { status: 400 }
      );
    }

    // Find the team created by the authenticated Project Manager
    const team = await Team.findOne({ teamId, createdBy: userId });
    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    // Return the team data as JSON
    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Error fetching team data:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch team data." },
      { status: 500 }
    );
  }
}
