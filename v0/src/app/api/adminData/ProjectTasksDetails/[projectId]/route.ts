// src/app/api/adminData/ProjectTasksDetails/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User"; // Needed for populating task assignees
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType } from "@/utils/token";
import mongoose from "mongoose";

// --- Interfaces for Populated Data ---
interface PopulatedAssignee {
  _id: mongoose.Types.ObjectId | string;
  UserId: string;
  firstname: string;
  lastname: string;
  profilepic: string;
}

interface PopulatedTask
  extends Omit<InstanceType<typeof Task>, "assignedTo" | "submittedby"> {
  _id: mongoose.Types.ObjectId | string;
  assignedTo: PopulatedAssignee[];
  submittedby?: PopulatedAssignee | string | null; // Can be populated user, UserId string, or null/default
}

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const targetProjectId = params.projectId; // Get ProjectId from URL

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
    if (!targetProjectId)
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request: Project ID parameter is missing.",
        },
        { status: 400 }
      );

    await connectToDatabase();

    // 2. Fetch Project Details
    const projectDetails = await Project.findOne({
      ProjectId: targetProjectId,
    }).lean();

    if (!projectDetails) {
      return NextResponse.json(
        { success: false, message: "Project not found." },
        { status: 404 }
      );
    }

    // 3. Find the Assignment Log for this Project
    // Assuming a project is assigned only once (as per earlier descriptions)
    const assignmentLog = await AssignedProjectLog.findOne({
      projectId: targetProjectId,
    });

    let tasks: PopulatedTask[] = []; // Initialize tasks array

    // 4. If assignment log exists, fetch and populate tasks
    if (
      assignmentLog &&
      assignmentLog.tasksIds &&
      assignmentLog.tasksIds.length > 0
    ) {
      const taskIds = assignmentLog.tasksIds;

      // Fetch tasks and populate 'assignedTo' and 'submittedby'
      // Need to use the Task model directly here
      tasks = await Task.find({ TaskId: { $in: taskIds } })
        .populate<{ assignedTo: PopulatedAssignee[] }>({
          path: "assignedTo",
          model: User,
          foreignField: "UserId", // Match Task.assignedTo values with User.UserId
          select: "_id UserId firstname lastname profilepic email",
        })
        // Optionally populate submittedby if it stores a UserId
        // Note: Handle cases where submittedby might be a default string like "Not-submitted"
        // This populate might fail or return null if submittedby isn't a valid UserId format
        // .populate<{ submittedby: PopulatedAssignee | null }>({
        //     path: 'submittedby',
        //     model: User,
        //     foreignField: 'UserId',
        //     select: '_id UserId firstname lastname profilepic',
        //     match: { UserId: { $exists: true } } // Attempt to only populate if it looks like a UserId
        // })
        .lean<PopulatedTask[]>(); // Specify the lean type
    } else {
      console.log(
        `No assignment log or tasks found for project ${targetProjectId}`
      );
    }

    // 5. Return Combined Data
    return NextResponse.json({
      success: true,
      projectDetails: projectDetails,
      tasks: tasks, // Will be empty array if no assignment or no tasks
    });
  } catch (error) {
    console.error(
      `❌ Error fetching project/task details for ${params?.projectId}:`,
      error
    );
    let errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    if (error instanceof Error && error.name === "CastError") {
      errorMessage = `Data relationship error: ${error.message}`;
    }
    return NextResponse.json(
      { success: false, message: `Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
