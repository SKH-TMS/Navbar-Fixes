import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserId, GetUserType } from "@/utils/token";
import Task from "@/models/Task";

export async function POST(req: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. No token provided." },
        { status: 401 }
      );
    }
    const usertype = await GetUserType(token);
    if (usertype !== "ProjectManager") {
      return NextResponse.json(
        { success: false, message: "You are not a projectManager." },
        { status: 401 }
      );
    }
    // Get the user ID from the token
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    const { projectIds } = await req.json(); // Extract project IDs from the request body
    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No project IDs provided." },
        { status: 400 }
      );
    }

    // Fetch the AssignedProjectLogs for the given project IDs
    const assignedLogs = await AssignedProjectLog.find({
      projectId: { $in: projectIds },
    });

    if (!assignedLogs || assignedLogs.length === 0) {
      return NextResponse.json(
        { success: false, message: "No assigned project logs found." },
        { status: 404 }
      );
    }

    // Extract all task IDs from the found AssignedProjectLogs
    const allTaskIds = assignedLogs.reduce((acc, log) => {
      return acc.concat(log.tasksIds);
    }, []);

    // Delete all tasks associated with these taskIds
    const deletedTasks = await Task.deleteMany({
      TaskId: { $in: allTaskIds },
    });

    if (deletedTasks.deletedCount === 0) {
      console.log("No tasks had been assigned to this project");
    }

    // Delete the AssignedProjectLogs
    const deletedAssignedLogs = await AssignedProjectLog.deleteMany({
      projectId: { $in: projectIds },
    });

    if (deletedAssignedLogs.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No assigned project logs found to delete.",
        },
        { status: 404 }
      );
    }

    // Return success if everything went well
    return NextResponse.json({
      success: true,
      message: "Projects unassigned successfully, tasks and logs deleted.",
    });
  } catch (error) {
    console.error("Error unassigning projects:", error);
    return NextResponse.json(
      { success: false, message: "Failed to unassign projects." },
      { status: 500 }
    );
  }
}
