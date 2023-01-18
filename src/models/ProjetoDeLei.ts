import mongoose from "mongoose";

export interface ProjetoDeLei {
  userId: string;
  title: string;
  content: string;
  meta: {
    moderator?: string;
    createdAt: Date;
    status: "pending" | "accepted" | "rejected";
    rejectReason?: string;
    handledAt?: Date;
    notified: boolean;
    thread?: string;
  };
}

const projetoDeLeiSchema = new mongoose.Schema<ProjetoDeLei>({
  userId: {
    required: true,
    type: String,
  },
  title: {
    required: true,
    type: String,
    maxlength: 80,
    minlength: 10,
  },
  content: {
    required: true,
    type: String,
    maxlength: 4000,
  },
  meta: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    moderator: {
      required: false,
      type: String,
      maxlength: 4000,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
    handledAt: {
      required: false,
      type: Date,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    thread: {
      required: false,
      type: String,
    },
  },
});

export const ProjetoDeLeiModel = mongoose.model(
  "ProjetoDeLei",
  projetoDeLeiSchema
);
