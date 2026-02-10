"use client";

import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: process.env.PLASMIC_PROJECT_ID!,
      token: process.env.PLASMIC_PUBLIC_API_TOKEN!,
    },
  ],
});
