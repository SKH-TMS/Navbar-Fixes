import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import Task from "@/models/Task";
import { getToken, GetUserId, GetUserType } from "@/utils/token";

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }

    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (!userType || userType !== "ProjectManager") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access. You are not a Project Manager.",
        },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Parse the JSON body
    const { teamIds } = await req.json();

    if (!teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body. 'teamIds' must be provided.",
        },
        { status: 400 }
      );
    }

    // Ensure that the teams belong to the current user
    const teamsToDelete = await Team.find({
      teamId: { $in: teamIds },
      createdBy: userId,
    });
    if (teamsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: "No teams found to delete." },
        { status: 404 }
      );
    }

    // Fetch all assignment logs associated with these teams
    const logs = await AssignedProjectLog.find({
      teamId: { $in: teamIds },
    });

    // Collect all task IDs from the assignment logs
    const tasksToDelete = logs.reduce((acc: string[], log) => {
      if (log.tasksIds && log.tasksIds.length > 0) {
        return [...acc, ...log.tasksIds];
      }
      return acc;
    }, []);

    // Delete associated tasks (if any)
    if (tasksToDelete.length > 0) {
      await Task.deleteMany({ TaskId: { $in: tasksToDelete } });
    }

    // Delete the assignment logs for the selected teams
    await AssignedProjectLog.deleteMany({ teamId: { $in: teamIds } });

    // Delete the teams themselves
    await Team.deleteMany({ teamId: { $in: teamIds }, createdBy: userId });

    return NextResponse.json({
      success: true,
      message:
        "Selected teams and associated assignment logs and tasks deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting teams:", error);
    return NextResponse.json(
      { success: false, message: "Error deleting teams." },
      { status: 500 }
    );
  }
}
