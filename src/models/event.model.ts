import { model, Schema } from "mongoose";

const imageSchema = new Schema({
  imageURL: String,
  key: String,
});

const eventSchema = new Schema(
  {
    name: String,
    slug: String,
    description: String,
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    venue: String,
    date: String,
    recurring: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "draft",
    },
    accepted: [
      {
        id: Schema.Types.ObjectId,
        name: String,
        image: imageSchema,
      },
    ],
    declined: [
      {
        id: Schema.Types.ObjectId,
        name: String,
        image: imageSchema,
      },
    ],
    image: imageSchema,
    gallery: [imageSchema],
    createdBy: Schema.Types.ObjectId,
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

const eventModel = model("Event", eventSchema);

export default eventModel;
