import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Team from "@/models/Team";
import Task from "@/models/Task";
import AssignedProjectLog from "@/models/AssignedProjectLogs";
import { getToken, GetUserType, GetUserId } from "@/utils/token";
import Admin from "@/models/Admin";

// Basic email validation regex (adjust if needed)
const emailRegex =
  /^(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/;

export async function DELETE(req: NextRequest) {
  const processingResults = {
    validPmEmailsProcessed: [] as string[],
    validPmUserIdsProcessed: [] as string[], // Store UserIds for relation checks
    invalidOrSkippedEmails: [] as { email: string; reason: string }[],
    deletedProjectsCount: 0,
    deletedTeamsCount: 0,
    deletedAssignmentsCount: 0,
    deletedTasksCount: 0,
    deletedUsersCount: 0,
  };

  try {
    // 1. Authentication & Authorization
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }

    const adminUserType = await GetUserType(token);
    const adminUserId = await GetUserId(token); // Still need admin UserId

    if (adminUserType !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    await connectToDatabase(); // Connect early for admin email fetch

    // Fetch Admin's email for self-deletion check
    const adminUser = await Admin.findOne(
      { UserId: adminUserId },
      { email: 1 }
    );
    if (!adminUser) {
      // Should not happen if token is valid, but handle defensively
      return NextResponse.json(
        {
          success: false,
          message: "Server Error: Could not verify admin identity.",
        },
        { status: 500 }
      );
    }
    const adminEmail = adminUser.email;

    // 2. Get Target Project Manager Emails from request body
    const body = await req.json();
    const pmEmailsToDeleteInput: unknown = body.emails; // Expecting { "emails": ["pm@example.com", ...] }

    if (
      !Array.isArray(pmEmailsToDeleteInput) ||
      pmEmailsToDeleteInput.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bad Request: 'emails' array is required and cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Filter out invalid formats and the admin's own email
    const potentialPmEmails = pmEmailsToDeleteInput
      .filter((email): email is string => {
        if (typeof email !== "string" || !emailRegex.test(email)) {
          processingResults.invalidOrSkippedEmails.push({
            email: String(email),
            reason: "Invalid email format",
          });
          return false;
        }
        if (email.toLowerCase() === adminEmail.toLowerCase()) {
          processingResults.invalidOrSkippedEmails.push({
            email: email,
            reason: "Admin cannot delete self",
          });
          return false;
        }
        return true;
      })
      .map((email) => email.toLowerCase()); // Normalize to lowercase

    const uniquePotentialPmEmails = Array.from(new Set(potentialPmEmails));

    if (uniquePotentialPmEmails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid Project Manager emails provided for deletion.",
          details: processingResults,
        },
        { status: 400 }
      );
    }

    // 3. Validation: Check which potential emails belong to actual Project Managers
    const usersFound = await User.find(
      { email: { $in: uniquePotentialPmEmails } },
      { UserId: 1, userType: 1, email: 1 } // Select needed fields
    ).lean();

    const usersFoundMap = new Map(
      usersFound.map((u) => [
        u.email.toLowerCase(),
        { userId: u.UserId, userType: u.userType },
      ])
    );

    uniquePotentialPmEmails.forEach((email) => {
      const userData = usersFoundMap.get(email); // Lookup normalized email
      if (userData && userData.userType === "ProjectManager") {
        processingResults.validPmEmailsProcessed.push(email);
        processingResults.validPmUserIdsProcessed.push(userData.userId); // Store UserId
      } else if (userData) {
        processingResults.invalidOrSkippedEmails.push({
          email: email,
          reason: `Not a Project Manager (Type: ${userData.userType})`,
        });
      } else {
        processingResults.invalidOrSkippedEmails.push({
          email: email,
          reason: "User not found",
        });
      }
    });

    const validPmUserIds = processingResults.validPmUserIdsProcessed; // Use UserIds for relation checks
    const validPmEmails = processingResults.validPmEmailsProcessed; // Use Emails for final user deletion

    if (validPmUserIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid Project Managers found to delete based on provided emails.",
          details: processingResults,
        },
        { status: 404 }
      );
    }

    console.log(
      `Initiating deletion cascade for ${validPmEmails.length} Project Managers (Emails):`,
      validPmEmails
    );
    console.log(`Corresponding UserIds:`, validPmUserIds);

    // --- 4. Aggregate Associated Data (Using UserIds) ---
    const projectIdsToDeleteSet = new Set<string>();
    const teamIdsToDeleteSet = new Set<string>();
    const assignmentIdsToDeleteSet = new Set<string>();
    const taskIdsToDeleteSet = new Set<string>();

    // Find Projects created by these PMs (using UserIds)
    const projectsToDelete = await Project.find(
      { createdBy: { $in: validPmUserIds } },
      { ProjectId: 1 }
    ).lean();
    projectsToDelete.forEach((p) => projectIdsToDeleteSet.add(p.ProjectId));
    console.log(
      `Found ${projectIdsToDeleteSet.size} unique projects to delete.`
    );

    // Find Teams created by these PMs (using UserIds)
    const teamsToDelete = await Team.find(
      { createdBy: { $in: validPmUserIds } },
      { teamId: 1 }
    ).lean();
    teamsToDelete.forEach((t) => teamIdsToDeleteSet.add(t.teamId));
    console.log(`Found ${teamIdsToDeleteSet.size} unique teams to delete.`);

    // Find Assignments made by these PMs (using UserIds)
    const assignmentsToDelete = await AssignedProjectLog.find(
      { assignedBy: { $in: validPmUserIds } },
      { AssignProjectId: 1, tasksIds: 1 }
    ).lean();
    assignmentsToDelete.forEach((a) => {
      assignmentIdsToDeleteSet.add(a.AssignProjectId);
      if (a.tasksIds && Array.isArray(a.tasksIds)) {
        a.tasksIds.forEach((taskId) => taskIdsToDeleteSet.add(taskId));
      }
    });
    console.log(
      `Found ${assignmentIdsToDeleteSet.size} unique assignments to delete.`
    );
    console.log(`Found ${taskIdsToDeleteSet.size} unique tasks to delete.`);

    // Convert Sets to Arrays for deletion queries
    const taskIdsToDelete = Array.from(taskIdsToDeleteSet);
    const assignmentIdsToDelete = Array.from(assignmentIdsToDeleteSet);
    const teamIdsToDelete = Array.from(teamIdsToDeleteSet);
    const projectIdsToDelete = Array.from(projectIdsToDeleteSet);

    // --- 5. Perform Deletions (Bulk - Order: Tasks -> Assignments -> Teams -> Projects -> Users) ---

    // Delete Tasks
    if (taskIdsToDelete.length > 0) {
      console.log(`Deleting ${taskIdsToDelete.length} tasks...`);
      const taskDeletionResult = await Task.deleteMany({
        TaskId: { $in: taskIdsToDelete },
      });
      processingResults.deletedTasksCount = taskDeletionResult.deletedCount;
      console.log(`Tasks deleted: ${processingResults.deletedTasksCount}`);
    }

    // Delete Assignments
    if (assignmentIdsToDelete.length > 0) {
      console.log(`Deleting ${assignmentIdsToDelete.length} assignments...`);
      const assignmentDeletionResult = await AssignedProjectLog.deleteMany({
        AssignProjectId: { $in: assignmentIdsToDelete },
      });
      processingResults.deletedAssignmentsCount =
        assignmentDeletionResult.deletedCount;
      console.log(
        `Assignments deleted: ${processingResults.deletedAssignmentsCount}`
      );
    }

    // Delete Teams
    if (teamIdsToDelete.length > 0) {
      console.log(`Deleting ${teamIdsToDelete.length} teams...`);
      const teamDeletionResult = await Team.deleteMany({
        teamId: { $in: teamIdsToDelete },
      });
      processingResults.deletedTeamsCount = teamDeletionResult.deletedCount;
      console.log(`Teams deleted: ${processingResults.deletedTeamsCount}`);
    }

    // Delete Projects
    if (projectIdsToDelete.length > 0) {
      console.log(`Deleting ${projectIdsToDelete.length} projects...`);
      const projectDeletionResult = await Project.deleteMany({
        ProjectId: { $in: projectIdsToDelete },
      });
      processingResults.deletedProjectsCount =
        projectDeletionResult.deletedCount;
      console.log(
        `Projects deleted: ${processingResults.deletedProjectsCount}`
      );
    }

    // Finally, Delete the Project Manager Users (using Emails)
    console.log(
      `Deleting ${validPmEmails.length} Project Manager users by email...`
    );
    const userDeletionResult = await User.deleteMany({
      email: { $in: validPmEmails },
    }); // Delete by email
    processingResults.deletedUsersCount = userDeletionResult.deletedCount;
    console.log(
      `Project Manager users deleted: ${processingResults.deletedUsersCount}`
    );

    // --- 6. Return Response ---
    const status =
      processingResults.invalidOrSkippedEmails.length > 0 ? 207 : 200;
    const overallSuccess = status === 200;

    return NextResponse.json(
      {
        success: overallSuccess,
        message: `Deletion process completed for ${validPmEmails.length} Project Manager(s). ${processingResults.invalidOrSkippedEmails.length} email(s) were invalid or skipped.`,
        details: processingResults, // Contains emails processed/skipped and counts
      },
      { status: status }
    );
  } catch (error) {
    console.error(
      `❌ Error during bulk Project Manager deletion by email:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid JSON payload." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: `Server error during bulk Project Manager deletion: ${errorMessage}`,
        details: processingResults,
      },
      { status: 500 }
    );
  }
}
