import type { Request, Response } from "express";
import {
  getContacts,
  createContact,
  getContactById,
  updateContact,
  deleteContact,
} from "../models/contactModel.js";
import { pool } from "../config/db.js";
import cloudinary from "../config/cloudinary";

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "contacts" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || "");
      }
    );
    uploadStream.end(buffer);
  });
};

export async function list(req: Request, res: Response) {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 100);

    const data = await getContacts(
      Number.isFinite(page) && page > 0 ? page : 1,
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 100
    );

    res.json(data);
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { firstName, lastName, phone, email, company } = req.body;

    if (!firstName || !lastName || !email) {
      return res
        .status(400)
        .json({ error: "firstName, lastName, and email are required" });
    }

    // If multer processed an image
    let profileImage: string | null = null;
    if ((req as any).file) {
      try {
        profileImage = await uploadToCloudinary((req as any).file.buffer);
      } catch (cloudinaryErr) {
        console.error("Cloudinary upload failed:", cloudinaryErr);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
      }
    }

    try {
      const created = await createContact({
        firstName,
        lastName,
        phone: phone || null,
        email,
        company: company || null,
        profileImage,
      });
      res.status(201).json(created);
    } catch (dbErr: any) {
      if (dbErr?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Email already exists" });
      }
      console.error("Database error creating contact:", dbErr);
      res.status(500).json({ error: "Failed to save contact to database" });
    }
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("Error creating contact:", err);
    res.status(500).json({ error: "Failed to create contact" });
  }
}

export async function edit(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    const { firstName, lastName, phone, email, company } = req.body;

    console.log("Editing contact:", id, "New data:", { firstName, lastName, email });
    const existing = await getContactById(Number(id));
    if (!existing) {
      console.warn("Contact not found:", id);
      return res.status(404).json({ error: "Contact not found" });
    }

    let profileImage = existing.profileImage;
    if ((req as any).file) {
      console.log("Uploading new profile image to Cloudinary...");
      try {
        profileImage = await uploadToCloudinary((req as any).file.buffer);
        console.log("Upload successful:", profileImage);
      } catch (cloudinaryErr) {
        console.error("Cloudinary upload failed:", cloudinaryErr);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
      }
    }

    const updatedContact = {
      ...existing,
      firstName: firstName ?? existing.firstName,
      lastName: lastName ?? existing.lastName,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      company: company ?? existing.company,
      profileImage,
    };

    try {
      const result = await updateContact(id, updatedContact);
      res.json(result);
    } catch (dbErr) {
      console.error("Database update failed:", dbErr);
      res.status(500).json({ error: "Failed to update contact in database" });
    }
  } catch (err: any) {
    console.error("Error updating contact:", err);
    res.status(500).json({ error: err.message || "Failed to update contact" });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    const existing = await getContactById(id);
    if (!existing) {
      return res.status(404).json({ error: "Contact not found" });
    }

    await deleteContact(id);
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
}
