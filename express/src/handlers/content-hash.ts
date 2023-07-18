import { Request, Response } from "express";
import { ENSInstance } from "../provider.js";

import { EnsjsProfile, FormattedProfile } from "../types.js";
import { formatProfile } from "../utils.js";

const fallbackRecords = ["com.github", "com.twitter", "description", "url"];

export default async function handler(req: Request, res: Response<FormattedProfile | { error: string }>) {
  const { addressOrName } = req.params;

  // if it's not cached, fetch it
  const profile = await getEnsProfile(addressOrName);
  const formattedProfile = await formatProfile(profile, addressOrName);

  if (Object.keys(formattedProfile).length === 0) {
    return res.status(404).json({ error: `Unable to resolve ${addressOrName}` });
  }

  return res.status(200).json(formattedProfile);
}

export async function getEnsProfile(addressOrName: string): Promise<EnsjsProfile> {
  try {
    // timeout after 3 seconds (usually caused by The Graph downtime)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Timeout"));
      }, 3 * 1000);
    });

    const profile = (await Promise.race([
      ENSInstance.getProfile(addressOrName, {
        fallback: {
          texts: fallbackRecords,
        },
        skipGraph: false,
      }),
      timeoutPromise,
    ])) as EnsjsProfile;

    return profile;
  } catch (err: any) {
    // ensjs has a fallabck that returns data even in some errors
    if (err.data) {
      return err.data;
    }

    // if The Graph times out, run the query again with fallback records
    if (err.message === "Timeout") {
      const profile = (await ENSInstance.getProfile(addressOrName, {
        fallback: {
          texts: fallbackRecords,
        },
        skipGraph: true,
      })) as EnsjsProfile;

      return profile;
    }

    return {
      isMigrated: null,
      createdAt: null,
    };
  }
}
