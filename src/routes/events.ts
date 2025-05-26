import { Router, Request, Response } from "express";
import dotenv from "dotenv";

import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

import Event from "../models/event.model";
import Community from "../models/community.model";
import { slugify } from "../utils/slugify";
import { eventValidation } from "../validation/eventValidation";
import { s3 } from "../utils/s3";
import { IUser } from "interfaces";

dotenv.config();

const { S3_BUCKET_NAME } = process.env;

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const { valid, errors } = eventValidation(payload);
    if (!valid) {
      res.status(400).json(errors);
      return;
    }

    const existingCommunity = await Community.findById(payload.community);
    if (!existingCommunity) {
      res.status(400).json({ error: "Community does not exist" });
      return;
    }

    const slug = slugify(payload.name);
    const existingEvent = await Event.findOne({
      community: existingCommunity._id,
      slug,
    });
    if (existingEvent) {
      res.status(400).json({ error: "Event with name already exists" });
      return;
    }

    const newEvent = new Event({
      ...payload,
      slug,
    });
    const event = await newEvent.save();

    if (event) {
      await Community.findByIdAndUpdate(
        event.community,
        { $inc: { events: 1 } },
        {
          new: true,
          useFindAndModify: false,
        }
      );
    }

    res.status(201).json(event);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const events = await Event.find();

    res.status(200).json(events);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.status(200).json(event);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const events = await Event.find({ "accepted.id": userId });

    res.status(200).json(events);
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

    // TODO: Validate user. Should be event creator or admin.

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    let slug = event.slug;

    if (payload.name) {
      slug = slugify(payload.name);
      const existingEvent = await Event.findOne({
        _id: { $ne: id },
        slug,
      });
      if (existingEvent) {
        res.status(400).json({ error: "Event with name already exists" });
        return;
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { ...payload, slug },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json(updatedEvent);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Validate user. Should be event creator or admin.

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    await Community.findByIdAndUpdate(
      event.community,
      { $inc: { events: -1 } },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    const imageKeys: { Key: string }[] = [];
    if (event.image) {
      imageKeys.push({ Key: event.image.key });
    }
    if (event.gallery?.length > 0) {
      event.gallery.map((item) => {
        imageKeys.push({ Key: item.key });
      });
    }

    if (imageKeys.length > 0) {
      const command = new DeleteObjectsCommand({
        Bucket: S3_BUCKET_NAME,
        Delete: {
          Objects: imageKeys,
        },
      });

      await s3.send(command);
    }

    await Event.findByIdAndDelete(id);

    res.sendStatus(204);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

// invites

router.patch("/:id/accept-invite", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const newMember: IUser = {
      id: payload.id,
      name: payload.name,
      image: payload.image,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $push: { accepted: newMember } },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json(updatedEvent);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.patch("/:id/decline-invite", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const newMember: IUser = {
      id: payload.id,
      name: payload.name,
      image: payload.image,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $push: { declined: newMember } },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json(updatedEvent);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

// image

router.post("/:id/image", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // TODO: Validate user. Should be event creator or admin

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { image: { key: payload.key, imageURL: payload.imageURL } },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json(updatedEvent);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.delete("/:id/image", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Validate user. Should be event creator or admin

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (event.image.key) {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: event.image.key,
      });

      await s3.send(command);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { image: null },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json(updatedEvent);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

// gallery

router.post("/:id/gallery-image", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // TODO: Validate user. Should be event creator or admin

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $push: { gallery: { key: payload.key, imageURL: payload.imageURL } } },
      {
        new: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json(updatedEvent);
    return;
  } catch (error) {
    res.sendStatus(500);
    throw new Error(error);
  }
});

router.delete(
  "/:id/gallery-image/:key",
  async (req: Request, res: Response) => {
    try {
      const { id, key } = req.params;

      const event = await Event.findById(id);
      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      const galleryImages = event.gallery;
      const image = galleryImages.find((i) => i.key === key);

      if (image?.key) {
        const command = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: image.key,
        });

        await s3.send(command);
      }

      const updatedGallery = galleryImages.filter((i) => i.key !== key);

      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        { gallery: updatedGallery },
        {
          new: true,
          useFindAndModify: false,
        }
      );

      res.status(200).json(updatedEvent);
      return;
    } catch (error) {
      res.sendStatus(500);
      throw new Error(error);
    }
  }
);

export default router;
