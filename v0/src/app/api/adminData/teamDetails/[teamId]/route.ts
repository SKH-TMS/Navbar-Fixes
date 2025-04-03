// src/app/api/adminData/teamDetails/[teamId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User"; // Needed for populating members
import Project from "@/models/Project"; // Needed for populating projects
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const targetTeamId = params.teamId;

    // 1. Admin Authorization (remains the same)
    const token = await getToken(req);
    if (!token)
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    const requesterUserType = await GetUserType(token);
    if (requesterUserType !== "Admin")
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    if (!targetTeamId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Team ID parameter is missing.",
        },
        { status: 400 }
      );

    await connectToDatabase();

    // 2. Fetch Team Data and Populate Members/Leaders using correct foreignField
    const team = await Team.findOne({ teamId: targetTeamId })
      .populate({
        path: "members",
        model: User,
        // Specify the field in the 'User' model to match against values in 'members'
        foreignField: "UserId", // <-- FIX HERE
        select: "UserId firstname lastname email profilepic",
      })
      .populate({
        path: "teamLeader",
        model: User,
        // Specify the field in the 'User' model to match against values in 'teamLeader'
        foreignField: "UserId", // <-- FIX HERE
        select: "UserId firstname lastname email profilepic",
      })
      // Optionally populate createdBy if it stores UserId and not _id
      // .populate({ path: 'createdBy', model: User, foreignField: 'UserId', select: 'UserId firstname lastname email' })
      .lean();

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    // 3. Fetch Assigned Projects and Populate Project Details using correct foreignField
    const assignedProjects = await AssignedProjectLog.find({
      teamId: targetTeamId,
    })
      .populate({
        path: "projectId",
        model: Project,
        // Specify the field in the 'Project' model to match against values in 'projectId'
        foreignField: "ProjectId", // <-- FIX HERE
        select: "ProjectId title description status createdAt",
      })
      // Optionally populate assignedBy if it stores UserId
      // .populate({ path: 'assignedBy', model: User, foreignField: 'UserId', select: 'UserId firstname lastname' })
      .lean();

    // 4. Return Combined Data
    return NextResponse.json({
      success: true,
      teamDetails: team,
      assignedProjects: assignedProjects,
    });
  } catch (error) {
    console.error(
      `❌ Error fetching team details for ${params?.teamId}:`,
      error
    );
    // Provide more specific error message for casting errors if possible
    let errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    if (error instanceof Error && error.name === "CastError") {
      errorMessage = `Data relationship error: ${error.message}`; // More specific message
    }
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
