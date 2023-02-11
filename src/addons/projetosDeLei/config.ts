import { PRJ_LEI_MENTION, PRJ_LEI_SEND_CHANNEL, PRJ_LEI_VERIFY_CHANNEL } from "../../config";

export const config = {
  mention_user: PRJ_LEI_MENTION,
  send_channel: PRJ_LEI_SEND_CHANNEL,
  verify_channel: PRJ_LEI_VERIFY_CHANNEL,
  customIds: {
    suggestNewProject: "create-project",
    titleField: "project-title",
    contentField: "project-content",
    projectForm: "project-form",
    aprovedButton: "aproved-button",
    rejectButton: "reject-button",
    rejectReason: "reject-reason",
    rejectForm: "reject-form",
  },
};
