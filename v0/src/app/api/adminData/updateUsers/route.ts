// src/app/api/adminData/updateUsers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getToken, GetUserType } from "@/utils/token"; // Your token utils
import bcrypt from "bcryptjs"; // Import bcryptjs for hashing

export async function PUT(req: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const token = await getToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided." },
        { status: 401 }
      );
    }
    const userType = await GetUserType(token);
    if (userType !== "Admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required." },
        { status: 403 }
      );
    }

    // 2. Parse Request Body
    const { users: usersToUpdate } = await req.json();

    if (!Array.isArray(usersToUpdate) || usersToUpdate.length === 0) {
      return NextResponse.json(
        { success: false, message: "Bad Request: No user data provided." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 3. Process updates using Promise.all
    const updatePromises = usersToUpdate.map(async (userData) => {
      // Destructure potential password along with other fields
      const {
        UserId: userId,
        firstname,
        lastname,
        contact,
        password,
      } = userData;

      // Validate UserId
      if (!userId || typeof userId !== "string" || userId.trim() === "") {
        console.warn(
          "Skipping update due to missing or invalid UserId:",
          userId
        );
        return {
          success: false,
          id: userId || null,
          message: "Missing or invalid user ID",
        };
      }

      // Prepare fields to update. Start with non-password fields.
      const updateFields: {
        firstname?: string;
        lastname?: string;
        contact?: string;
        password?: string; // Add password field conditionally
      } = {};

      if (firstname !== undefined) updateFields.firstname = firstname;
      if (lastname !== undefined) updateFields.lastname = lastname;
      if (contact !== undefined) updateFields.contact = contact;

      // --- Handle New Password ---
      // Check if a new password was provided and is not empty
      if (password && typeof password === "string" && password.trim() !== "") {
        try {
          console.log(`Hashing new password for user ${userId}...`);
          // Hash the new password
          const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10
          updateFields.password = hashedPassword; // Add hashed password to update object
          console.log(`Password hashed successfully for user ${userId}.`);
        } catch (hashError) {
          console.error(
            `Error hashing password for user ${userId}:`,
            hashError
          );
          // Decide how to handle hashing errors: skip user or return failure
          return {
            success: false,
            id: userId,
            message: `Server error: Failed to hash password for user ${userId}.`,
          };
        }
      } else {
        // Log if password field is present but empty/invalid, or just not present
        if (password !== undefined) {
          console.log(
            `Password field present but empty/invalid for user ${userId}. Password not updated.`
          );
        } else {
          console.log(
            `No new password provided for user ${userId}. Password not updated.`
          );
        }
      }
      // --- End Handle New Password ---

      // Skip database update if no fields (including potentially hashed password) are being changed
      if (Object.keys(updateFields).length === 0) {
        console.log(`No fields to update for user ${userId}. Skipping.`);
        return { success: true, id: userId, message: "No fields to update" };
      }

      try {
        // 4. Perform Update using UserId in the filter and $set with updateFields
        console.log(
          `Attempting to update user ${userId} with fields:`,
          Object.keys(updateFields)
        );
        const result = await User.updateOne(
          { UserId: userId }, // Find user by UserId
          { $set: updateFields } // Set the fields (including hashed password if applicable)
        );

        if (result.matchedCount === 0) {
          console.warn(`User with UserId ${userId} not found for update.`);
          return { success: false, id: userId, message: "User not found" };
        }
        console.log(
          `Update result for user ${userId}: Matched=${result.matchedCount}, Modified=${result.modifiedCount}`
        );
        return {
          success: true,
          id: userId,
          message:
            result.modifiedCount > 0 ? "User updated" : "No changes needed",
        };
      } catch (dbError) {
        console.error(`Database error updating user ${userId}:`, dbError);
        // Check for specific errors like validation errors if needed
        return {
          success: false,
          id: userId,
          message: `Database error: ${
            dbError instanceof Error ? dbError.message : "Unknown DB error"
          }`,
        };
      }
    });

    // Wait for all update operations to complete
    const results = await Promise.all(updatePromises);

    // 5. Aggregate results and respond (same logic as before)
    const successfulUpdates = results.filter((r) => r.success);
    const failedUpdates = results.filter((r) => !r.success);

    if (failedUpdates.length > 0) {
      console.error("Some users failed to update:", failedUpdates);
      return NextResponse.json(
        {
          success: false,
          message: `Operation completed with ${failedUpdates.length} failure(s).`,
          successfulCount: successfulUpdates.length,
          failedCount: failedUpdates.length,
          details: results,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: `${successfulUpdates.length} user(s) processed successfully.`,
      details: results,
    });
  } catch (error) {
    // Outer error handling (same as before)
    console.error("❌ Error processing user updates:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: "Bad Request: Invalid JSON payload." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
