/** Hide Facebook OAuth on Clerk prebuilt sign-in/up UI. */
export const clerkAuthAppearance = {
  elements: {
    socialButtonsBlockButton__facebook: { display: "none" },
  },
} as const;
