import { IEvent } from "interfaces";
import { isValidObjectId } from "mongoose";

const eventValidation = (
  event: IEvent
): { valid: boolean; errors: Record<string, string> } => {
  const { name, community, venue, date, createdBy } =
    event;
  const errors: Record<string, string> = {};

  if (!name || name.trim() === "") {
    errors.name = "event name is required";
  }

  if (!community || community.trim() === "") {
    errors.community = "community is required";
  } else {
    if (!isValidObjectId(community)) {
      errors.createdBy = "community should be a valid id";
    }
  }

  if (!venue || venue.trim() === "") {
    errors.venue = "venue is required";
  }

  if (!date || date.trim() === "") {
    errors.date = "date is required";
  }

  if (!createdBy || createdBy.trim() === "") {
    errors.createdBy = "created by is required";
  } else {
    if (!isValidObjectId(createdBy)) {
      errors.createdBy = "created by should be a valid id";
    }
  }

  return {
    valid: Object.keys(errors).length < 1,
    errors,
  };
};

export { eventValidation };
