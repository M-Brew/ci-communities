import { Router, Request, Response } from "express";

import Community from "../models/community.model";
import { communityValidation } from "../validation/communityValidation";
import { slugify } from "../utils/slugify";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const { valid, errors } = communityValidation(payload);
    if (!valid) {
      res.status(400).json(errors);
      return;
    }

    const slug = slugify(payload.name);
    const existingCommunity = await Community.findOne({ slug });
    if (existingCommunity) {
      res.status(400).json({ error: "Community with name already exists" });
      return;
    }

    const newCommunity = new Community({ ...payload, slug });
    const community = await newCommunity.save();

    res.status(201).json(community);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const communities = await Community.find();

    res.status(200).json(communities);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      res.status(404).json({ error: "Community not found" });
      return;
    }

    res.status(200).json(community);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const community = await Community.findById(id);
    if (!community) {
      res.status(404).json({ error: "Community not found" });
      return;
    }

    const slug = slugify(payload.name);
    const existingCommunity = await Community.findOne({
      _id: { $ne: id },
      slug,
    });
    if (existingCommunity) {
      res.status(400).json({ error: "Community with name already exists" });
      return;
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      id,
      { name: payload.name, slug },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json(updatedCommunity);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const community = await Community.findById(id);
    if (!community) {
      res.status(404).json({ error: "Community not found" });
      return;
    }

    await Community.findByIdAndDelete(id);

    res.sendStatus(204);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

export default router;
