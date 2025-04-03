import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { getToken, GetUserId, GetUserType } from "@/utils/token";
import { updateProjectSchema } from "@/schemas/projectSchema";
export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
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
    const userId = await GetUserId(token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. User ID not found." },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    const { projectId } = params;
    const { title, description } = await req.json();
    const parsedData = updateProjectSchema.safeParse({
      title,
      description,
    });

    if (!parsedData.success) {
      // If validation fails, return an error with the validation message
      const errorMessages = parsedData.error.errors
        .map((err) => err.message)
        .join(", ");
      return NextResponse.json(
        { success: false, message: errorMessages },
        { status: 400 }
      );
    }

    // Find the project by ID
    const project = await Project.findOne({ ProjectId: projectId });

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found." },
        { status: 404 }
      );
    }

    // Check if the user is authorized to update this project
    if (project.createdBy !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to update this project.",
        },
        { status: 403 }
      );
    }

    // Update project details
    project.title = title;
    project.description = description;

    await project.save();

    return NextResponse.json({
      success: true,
      message: "Project updated successfully.",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update project." },
      { status: 500 }
    );
  }
}
