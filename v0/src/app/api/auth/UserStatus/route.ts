import { NextResponse } from "next/server";
import { getToken, verifyToken, GetUserType, GetUserRole } from "@/utils/token";
import { connectToDatabase } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import User from "@/models/User";
import Team from "@/models/Team";
export async function POST(req: Request) {
  try {
    console.log("User verification started...");

    await connectToDatabase(); // Connect to MongoDB using Mongoose

    const token = getToken(req); // Extract token from request

    if (!token) {
      return NextResponse.json(
        {
          success: true,
          message: "No token provide",
        },
        { status: 401 }
      );
    }

    // Verify and decode the token
    const decodedUser = verifyToken(token);

    if (!decodedUser || !decodedUser.email) {
      return NextResponse.json(
        {
          success: true,
          message: "Invalid token",
        },
        { status: 403 }
      );
    }
    const userRole = GetUserRole(token);

    if (userRole) {
      const TML = true;
      const teamleader = userRole.includes("TeamLeader");
      const teamMember = userRole.includes("TeamMember");
      if (teamMember && teamleader) {
        return NextResponse.json(
          {
            success: true,
            message: "User is a team Member and TeamLeader",
            TeamMember_and_TeamLeader: true,
            TML,
          },
          { status: 200 }
        );
      } else if (teamMember) {
        return NextResponse.json(
          {
            success: true,
            message: "User is a team Member",
            TeamMember: true,
            TML,
          },
          { status: 200 }
        );
      } else if (teamleader) {
        return NextResponse.json(
          {
            success: true,
            message: "User is a team Member",
            TeamLeader: true,
            TML,
          },
          { status: 200 }
        );
      }
    }

    const userType = GetUserType(token);
    if (userType) {
      if (userType === "Admin") {
        return NextResponse.json(
          {
            success: true,
            message: "User is a Admin",
            Admin: true,
          },
          { status: 200 }
        );
      } else if (userType === "User") {
        return NextResponse.json(
          {
            success: true,
            message: "User is not a team Participant",
            User: true,
          },
          { status: 200 }
        );
      } else if (userType === "ProjectManager") {
        return NextResponse.json(
          {
            success: true,
            message: "User is a ProjectManager",
            ProjectManager: true,
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          {
            success: true,
            message: "User is not a authenticated",
          },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.error(" Error verifying User:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error verifying User",
      },
      { status: 500 }
    );
  }
}
