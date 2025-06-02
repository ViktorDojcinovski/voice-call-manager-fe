import { CallSession } from "../types/contact";

export const getDialingSessionsWithStatuses = (
  batch: CallSession[],
  ringingSessions: CallSession[],
  pendingResultContacts: CallSession[]
) => {
  return batch.map((contact) => {
    const isRinging = ringingSessions.some((c) => c._id === contact._id);
    const isCompleted = pendingResultContacts.some(
      (c) => c._id === contact._id
    );
    let status = "Starting";
    if (isRinging) {
      status = "Ringing";
    } else if (isCompleted) {
      status = "Completed";
    }
    return {
      ...contact,
      status,
    };
  });
};
