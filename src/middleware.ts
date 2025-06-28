import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/api/extract-document", // Add this line
    "/api/upload-file", // Add this line
    "/api/sync-with-spreadsheet", // Add this line
    "/api/get-document-screenshot", // Add this line
    "/api/random-project-name", // Add this line
    "/api/sheets/access-check", // Add this line
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    "/api/webhooks(.*)",
  ],
});

export const config = {
  // Protects all routes, including api/trpc.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Always run for API routes
    "/(api|trpc)(.*)"
  ],
};
