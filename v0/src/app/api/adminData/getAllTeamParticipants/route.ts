export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User, { IUser } from "@/models/User"; // Import IUser if needed for type hints
import Team from "@/models/Team";
import { getToken, GetUserType } from "@/utils/token";

// Define an interface for the response object structure
interface IUserWithRole extends IUser {
  UserRole: string;
}

export async function GET(req: NextRequest) {
  try {
    // --- Authentication & Authorization ---
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    // Decide who can access this - Admins? Project Managers?
    // Let's assume Admin for now
    if (!userType || userType !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Only Admins can view team participants.",
        },
        { status: 403 }
      );
    }

    // --- Database Connection ---
    await connectToDatabase();

    // --- Step 1: Get all unique leader and member UserIds ---
    const allLeaderIds = await Team.distinct("teamLeader");
    const allMemberIds = await Team.distinct("members");

    // Create Sets for efficient lookup
    const leaderIdSet = new Set(allLeaderIds);
    const memberIdSet = new Set(allMemberIds);

    // Combine all unique participant UserIds
    const allParticipantUserIds = Array.from(
      new Set([...allLeaderIds, ...allMemberIds])
    );

    // --- Step 2: Fetch User documents for all participants ---
    // Use .lean() for performance if you don't need Mongoose documents later
    const participants = await User.find({
      UserId: { $in: allParticipantUserIds },
    }).lean<IUser[]>(); // Use lean for plain JS objects, faster reads

    // --- Step 3 & 4: Determine role for each participant and format output ---
    const participantsWithRoles: IUserWithRole[] = participants.map((user) => {
      const isLeader = leaderIdSet.has(user.UserId);
      const isMember = memberIdSet.has(user.UserId);
      let userRole = "";

      if (isLeader && isMember) {
        userRole = "TeamLeader and TeamMember";
      } else if (isLeader) {
        userRole = "TeamLeader";
      } else if (isMember) {
        // This condition assumes if they are only in members array, they are just a member
        userRole = "TeamMember";
      } else {
        // This case should technically not be reachable if the logic is correct
        // because we only fetched users who were in the participant lists.
        userRole = "Unknown Role"; // Or handle as an error/log
      }

      // Combine the original user data (as plain object from .lean())
      // with the new UserRole field
      return {
        ...(user as any), // Cast to any or use a proper type spread
        UserRole: userRole,
      };
    });

    // --- Step 5: Return the result ---
    return NextResponse.json({
      success: true,
      participants: participantsWithRoles,
    });
  } catch (error) {
    console.error("Error fetching team participants:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch team participants. Error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
