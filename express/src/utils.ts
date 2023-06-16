import { EnsjsProfile, FormattedProfile } from "./types.js";

const zeroAddress = "0x0000000000000000000000000000000000000000";

export async function formatProfile(
  profile: EnsjsProfile | undefined,
  addressOrName: string
): Promise<FormattedProfile> {
  // Return empty object if no profile
  if (!profile || profile.resolverAddress === zeroAddress || profile.message === "Name doesn't have a resolver") {
    return {};
  }

  // If both address and name are null, it can't an ENS name
  if (!profile.name && !profile.address) {
    return {};
  }

  // Fill in the name or address from the request (ensjs doesn't return it)
  if (!profile.name) profile.name = addressOrName;
  if (!profile.address) profile.address = addressOrName;

  return {
    name: profile.name!,
    address: profile.address!,
    contentHash: profile.records?.contentHash!,
    records:
      profile.records?.texts?.reduce((acc, record) => {
        acc![record.key] = record.value;
        return acc;
      }, {} as FormattedProfile["records"]) || {},
  };
}
