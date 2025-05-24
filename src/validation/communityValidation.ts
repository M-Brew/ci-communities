import { ICommunity } from "interfaces";

const communityValidation = (
  community: ICommunity
): { valid: boolean; errors: Record<string, string> } => {
  const { name } = community;
  const errors: Record<string, string> = {};

  if (!name || name.trim() === "") {
    errors.name = "name is required";
  }

  return {
    valid: Object.keys(errors).length < 1,
    errors,
  };
};

export { communityValidation };
