import mongoose from "mongoose";

export interface ProjetoDeLei {
  owner: string;
  title: string;
  content: string;
  createdAt: Date;
  meta: {
    moderatorId?: string;
    status: "pending" | "accepted" | "rejected";
    rejectReason?: string;
    handledAt?: Date;
    ownerNotified: boolean;
    threadId?: string;
  };
}

const projetoDeLeiSchema = new mongoose.Schema<ProjetoDeLei>({
  owner: {
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  meta: {
    moderatorId: {
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
    ownerNotified: {
      type: Boolean,
      default: false,
    },
    threadId: {
      required: false,
      type: String,
    },
    rejectReason: {
      type: String,
    },
  },
});

export const ProjetoDeLeiModel = mongoose.model(
  "ProjetoDeLei",
  projetoDeLeiSchema
);
