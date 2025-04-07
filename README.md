# Navbar-Fixes
## Version 0

### Navigation
- I have changed the Navigation approach from using the "session" to jwt token.
- It is relatively more secure and has more error tollerence.
- I added the api file named "app/api/auth/UserStatus" this file is used for the navigation of all the navbars except a landing page Navbar.
- Follwoing this approach there is no need to add navbar again and again with all the pages you just need to declare it in the Layout of the folder and the Navbar will automatically be randered with all the     pages in the folder.
### Multi-Role Authentication and Layouts

- This repository implements a multi-role authentication system using  React Context. 
- The changes in this project streamline authentication across different roles (Admin, Team, User, and Project Manager) by utilizing folder-level layouts and a global authentication state.


### Overview

This project uses the Next.js App Router and incorporates:
- **Client Component-based Navbars:** Personalized navbars for Admin, Team, and User sections.
- **Global Authentication State:** Managed via a React Context (`AuthProvider`), reducing the need for page refreshes.
- **Folder-Level Layouts:** Each app section ( `adminData`, `teamData`, `userData`) has its own layout that imports and renders its specific navbar.

### Key Changes

#### Global AuthProvider Integration

- **What Changed:**  
  The entire application is now wrapped with an `AuthProvider` in `src/app/layout.tsx`.

- **Why:**  
  This centralizes the authentication state. Every page and layout can access the authentication state and the `refreshAuth` function without needing to refresh the whole page using techniques like   `router.refresh()`.
## Version 2

### Fixes
- Added the back routing to the pages of the admin
- Added missing context refreshing to the profile of a normal user
- Now the context is also refreshed in case of token deletion.

