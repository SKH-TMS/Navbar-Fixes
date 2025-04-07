export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { getToken, GetUserId, GetUserRole } from "@/utils/token";

export async function GET(req: NextRequest) {
  try {
    // Extract token and verify user
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    const userrole = GetUserRole(token);
    let isverified = false;
    if (userrole && userrole.includes("TeamLeader")) {
      isverified = true;
    }
    if (!isverified) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not a TeamLeader.",
        },
        { status: 401 }
      );
    }
    // Connect to the database
    await connectToDatabase();
    const userId = await GetUserId(token);
    // Fetch teams that the user is a team leader for
    const userTeams = await Team.find({ teamLeader: userId });

    // Fetch the members for each team using the 'members' field (user IDs)
    const teamMembersData = await Promise.all(
      userTeams.map(async (team) => {
        const members = await User.find({ UserId: { $in: team.members } });
        return {
          teamId: team.teamId,
          members: members.map((member) => ({
            UserId: member.UserId,
            firstname: member.firstname,
            lastname: member.lastname,
            profilepic: member.profilepic,
            email: member.email,
          })),
        };
      })
    );

    // Return the teams and members data separately
    return NextResponse.json({
      success: true,
      teams: userTeams,
      membersData: teamMembersData,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teams." },
      { status: 500 }
    );
  }
}
