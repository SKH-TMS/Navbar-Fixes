import { NextResponse } from "next/server";
import { generateToken, setToken } from "@/utils/token";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { loginSchema } from "@/schemas/userSchema";
import Team from "@/models/Team";
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: "Email and password are required.",
      });
    }
    // Validate the request data using the login schema
    const parsedData = loginSchema.safeParse({ email, password });

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
    // Connect to the MongoDB database
    await connectToDatabase();
    // Find the user with the matching email
    const user = await User.findOne({ email });

    if (!user) {
      // If user is not found or password is incorrect
      return NextResponse.json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare hashed password with provided password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Ensure profilePic exists, else use default
    const profilepic = user.profilepic
      ? user.profilepic
      : "/default-profile.png";

    //Handle Usertype for ProjectManager
    if (user.userType == "ProjectManager") {
      // Generate JWT token for the user
      const token = generateToken({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        profilepic: profilepic,
        contact: user.contact,
        userType: user.userType,
        UserId: user.UserId,
      });

      const res = NextResponse.json({
        success: true,
        message: "Login successful!",
        ProjectManager: {
          UserId: user.UserId,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profilepic: profilepic,
          contact: user.contact,
          userType: user.userType,
        },
      });

      // Set the token in the cookie
      setToken(res, token);

      return res;
    } else {
      // Check if the user is a team leader by searching the Team collection for their UserId in teamLeader
      const teamLeaderTeam = await Team.findOne({ teamLeader: user.UserId });
      // Check if the user is a team member by searching the Team collection for their UserId in members
      const teamMemberTeam = await Team.findOne({ members: user.UserId });

      const isTeamLeader = Boolean(teamLeaderTeam);
      const isTeamMember = Boolean(teamMemberTeam);

      // Build an array of roles based on the team relationships
      const userRoles: string[] = [];
      if (isTeamLeader) userRoles.push("TeamLeader");
      if (isTeamMember) userRoles.push("TeamMember");

      if (isTeamLeader || isTeamMember) {
        // Always use the same property name ("userRoles")
        const token = generateToken({
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profilepic: profilepic, // Ensure correct field is used
          contact: user.contact,
          userType: user.userType,
          UserId: user.UserId,
          userRoles,
        });

        const res = NextResponse.json({
          success: true,
          message: "Login successful!",
          user: {
            UserId: user.UserId,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            profilepic: profilepic,
            contact: user.contact,
            userType: user.userType,
            userRoles, // Always return userRoles (empty array if no role)
          },
        });

        // Set the token in the cookie
        setToken(res, token);
        return res;
      }
      // Generate JWT token for the user
      const token = generateToken({
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        profilepic: profilepic, // Ensure correct field is used
        contact: user.contact,
        userType: user.userType,
        UserId: user.UserId,
      });

      const res = NextResponse.json({
        success: true,
        message: "Login successful!",
        user: {
          UserId: user.UserId,
          userRole: user.userRole,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          profilepic: profilepic,
          contact: user.contact,
          userType: user.userType,
        },
      });

      // Set the token in the cookie
      setToken(res, token);
      return res;
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to log in. Please try again later.",
    });
  }
}
