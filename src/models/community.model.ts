import { model, Schema } from "mongoose";

const imageSchema = new Schema({
  imageURL: String,
  key: String,
});

const communitySchema = new Schema(
  {
    name: String,
    slug: String,
    description: String,
    count: {
      type: Number,
      default: 0
    },
    avatar: imageSchema,
    gallery: [imageSchema],
    createdBy: Schema.Types.ObjectId,
    lastUpdatedBy: Schema.Types.ObjectId,
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

const communityModel = model("Community", communitySchema);

export default communityModel;
