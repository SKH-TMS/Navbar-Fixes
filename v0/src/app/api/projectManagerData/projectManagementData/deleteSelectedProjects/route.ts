import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getToken, GetUserId, GetUserType } from "@/utils/token"; // Import the GetUserId function

export async function POST(req: NextRequest) {
  try {
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

    // Check each project to see if it was created by the current user
    const projects = await Project.find({ ProjectId: { $in: projectIds } });
    const projectsToDelete = projects.filter(
      (project) => project.createdBy.toString() === userId
    );

    if (projectsToDelete.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to delete these projects.",
        },
        { status: 403 }
      );
    }

    // Delete the selected projects
    const result = await Project.deleteMany({
      ProjectId: { $in: projectsToDelete.map((project) => project.ProjectId) },
    });

    // If no projects were deleted
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No projects found to delete." },
        { status: 404 }
      );
    }

    // Return success if the projects were deleted
    return NextResponse.json({
      success: true,
      message: "Projects deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting projects:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete projects." },
      { status: 500 }
    );
  }
}
