// src/app/api/adminData/ProjectManagerDetails/[UserId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Team from "@/models/Team";
import Project from "@/models/Project";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { UserId: string } }
) {
  try {
    const targetUserId = params.UserId; // Get PM's UserId from URL

    // 1. Admin Authorization
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
    if (!targetUserId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: User ID parameter is missing.",
        },
        { status: 400 }
      );

    await connectToDatabase();

    // 2. Fetch Project Manager Details
    const pmDetails = await User.findOne(
      { UserId: targetUserId, userType: "ProjectManager" }, // Ensure it's a PM
      { password: 0 } // Exclude password
    ).lean();

    if (!pmDetails) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project Manager not found or user is not a Project Manager.",
        },
        { status: 404 }
      );
    }

    // 3. Fetch Teams Created by this PM
    // Select fields needed for the TeamCard on the frontend
    const createdTeams = await Team.find({ createdBy: targetUserId })
      .select("teamId teamName members teamLeader") // Include members/leader arrays for counts
      .lean();

    // 4. Fetch All Projects Created by this PM
    const allCreatedProjects = await Project.find({ createdBy: targetUserId })
      .select("ProjectId title description status createdAt") // Select needed fields
      .lean();

    // 5. Fetch IDs of all Projects that have been assigned
    // We only need the projectId field from the logs
    const assignedProjectIdsResult = await AssignedProjectLog.distinct(
      "projectId"
    );
    // Ensure the result is an array of strings (or whatever type projectId is stored as in the log)
    const assignedProjectIds = new Set(assignedProjectIdsResult.map(String)); // Use Set for efficient lookup

    // 6. Filter for Unassigned Projects
    const unassignedProjects = allCreatedProjects.filter(
      (project) => !assignedProjectIds.has(project.ProjectId) // Keep project if its ID is NOT in the assigned set
    );

    // 7. Return Combined Data
    return NextResponse.json({
      success: true,
      pmDetails: pmDetails,
      createdTeams: createdTeams,
      unassignedProjects: unassignedProjects,
    });
  } catch (error) {
    console.error(
      `❌ Error fetching project manager details for ${params?.UserId}:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
