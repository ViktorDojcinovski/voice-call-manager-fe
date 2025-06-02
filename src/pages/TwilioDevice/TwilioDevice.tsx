import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  Card,
  CardContent,
  Typography,
  Container,
} from "@mui/material";

import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";

import AudioDevicesList from "./components/AudioDevicesList";
import StatusLine from "./components/DeviceStatus";
import DialingCards from "./components/DialingCards";
import ActiveDialingCard from "./components/ActiveDialingCard";
import { useTwilioCampaign } from "./useTwilioCampaign";
import { CustomTextField, SimpleButton } from "../../components/UI";
import { Contact } from "../../types/contact";
import { CallResult } from "../../types/call-results";
import ContinueDialog from "./components/ContinueDIalog";
import { getDialingSessionsWithStatuses } from "../../utils/getDialingSessionsWithStatuses";

enum TelephonyConnection {
  SOFT_CALL = "Soft call",
  PARALLEL_CALL = "Two Parallel calls",
  ADVANCED_PARALLEL_CALL = "Four Parallel calls",
}

interface LocationState {
  contacts: any[];
  mode: TelephonyConnection;
}

const TwilioDevice = () => {
  const location = useLocation();
  const { contacts, mode } = (location.state || {}) as LocationState;

  const settings = useAppStore((state) => state.settings);
  if (!settings) {
    throw new Error("Missing settings!");
  }
  const callResults = settings["Phone Settings"].callResults as CallResult[];
  const user = useAppStore((state) => state.user);

  // State management for the dialog box
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});

  // Custom hook state variables
  const {
    status,
    inputVolume,
    outputVolume,
    currentIndex,
    isCampaignRunning,
    isCampaignFinished,
    showContinueDialog,
    ringingSessions,
    answeredSession,
    pendingResultContacts,
    currentBatch,
    currentBatchRef,
    setCurrentBatch,
    setIsCampaignRunning,
    setIsCampaignFinished,
    setCurrentIndex,
    setPendingResultContacts,
    setShowContinueDialog,
    setStatus,
    setRingingSessions,
    handleHangUp,
  } = useTwilioCampaign({
    userId: user!.id,
  });

  const callsPerBatch = {
    [TelephonyConnection.SOFT_CALL]: 1,
    [TelephonyConnection.PARALLEL_CALL]: 2,
    [TelephonyConnection.ADVANCED_PARALLEL_CALL]: 4,
  }[mode];

  const makeCallBatch = async () => {
    // TO-DO implement try-catch
    const slice = contacts.slice(currentIndex, currentIndex + callsPerBatch);
    if (slice.length === 0) {
      setIsCampaignFinished(true);
      setRingingSessions([]);
      setIsCampaignRunning(false);
      return;
    }

    const { data } = await api.post("/contacts/batch", {
      ids: slice.map((contact) => contact._id),
    });
    const batchContacts = data;

    const activeCalls = await api.post("/campaign/call-campaign", {
      contacts: batchContacts,
    });

    const extendedBatchContactsWithSid = batchContacts.map(
      (batchContact: Contact) => {
        const call = activeCalls.data.find((activeCall: any) => {
          return batchContact.mobile_phone === activeCall.phoneNumber;
        });

        return { ...batchContact, callSid: call.callSid };
      }
    );

    setCurrentBatch(extendedBatchContactsWithSid);
    currentBatchRef.current = extendedBatchContactsWithSid;
    setStatus(`Calling ${batchContacts.length} contact(s)...`);
    setCurrentIndex((prev) => prev + callsPerBatch);
  };

  const handleStartCampaign = () => {
    setIsCampaignRunning(true);
    setIsCampaignFinished(false);
    setCurrentIndex(0);
    makeCallBatch();
  };

  const handleContinue = () => {
    setShowContinueDialog(false);
    makeCallBatch();
  };

  const handleStopCampaign = () => {
    setIsCampaignRunning(false);
    setShowContinueDialog(false);
    setStatus("Campaign manually stopped!");
    api.post("/campaign/stop-campaign");
  };

  const handleDialogClose = () => {
    setShowContinueDialog(false);
    makeCallBatch();
  };

  const handleResult = async (contact: Contact, result: string) => {
    await api.patch(`/contacts/${contact._id}`, {
      result,
      notes: contactNotes[contact._id] || "",
      timestamp: Date.now(),
    });
  };

  const maybeProceedWithNextBatch = () => {
    if (isCampaignRunning) {
      handleContinue();
    }
  };

  const hangUp = () => {
    api.post("/campaign/stop-campaign");
    handleHangUp();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <StatusLine status={status} />
        <Stack direction="row" spacing={1} justifyContent="center">
          <SimpleButton
            label="Start campaign"
            onClick={handleStartCampaign}
            disabled={isCampaignRunning}
          />
          <SimpleButton
            label="Stop campaign"
            onClick={handleStopCampaign}
            disabled={!isCampaignRunning}
          />
        </Stack>

        {/* Dialing Cards Section */}
        {!isCampaignFinished && !answeredSession && (
          <DialingCards
            sessions={getDialingSessionsWithStatuses(
              currentBatch,
              ringingSessions,
              pendingResultContacts
            )}
          />
        )}
        {!isCampaignFinished && answeredSession && (
          <ActiveDialingCard
            session={answeredSession}
            inputVolume={inputVolume}
            outputVolume={outputVolume}
            hangUp={hangUp}
          />
        )}

        {/* <AudioDevicesList devices={devices} /> */}
      </Stack>
      <ContinueDialog
        callResults={callResults}
        contactNotes={contactNotes}
        currentBatch={currentBatch}
        pendingResultContacts={pendingResultContacts}
        selectedResults={selectedResults}
        showContinueDialog={showContinueDialog}
        handleDialogClose={handleDialogClose}
        setSelectedResults={setSelectedResults}
        setPendingResultContacts={setPendingResultContacts}
        setShowContinueDialog={setShowContinueDialog}
        setContactNotes={setContactNotes}
        maybeProceedWithNextBatch={maybeProceedWithNextBatch}
        handleStopCampaign={handleStopCampaign}
        handleResult={handleResult}
      />
      {isCampaignFinished && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Call campaign completed!
        </Alert>
      )}
    </Container>
  );
};

export default TwilioDevice;
