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

  const {
    status,
    sessions,
    inputVolume,
    outputVolume,
    devices,
    currentIndex,
    isCampaignRunning,
    isCampaignFinished,
    showContinueDialog,
    pendingResultContacts,
    selectedResults,
    contactNotes,
    answeredSession,
    activeCallRef,
    setSessions,
    setCurrentBatch,
    setIsCampaignRunning,
    setIsCampaignFinished,
    setSelectedResults,
    setCurrentIndex,
    setPendingResultContacts,
    setShowContinueDialog,
    setStatus,
    setContactNotes,
    setRingingSessions,
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
    // Fetch full contact details for current batch
    const { data } = await api.post("/contacts/batch", {
      ids: slice.map((contact) => contact._id),
    });
    const batchContacts = data;

    // TO DO simplify sessions -- do not keep both sessions and currentBatch
    // they eventually should hold same structure of data
    const activeCalls = await api.post("/campaign/call-campaign", {
      phoneNumbers: batchContacts.map(
        (contact: Contact) => contact.mobile_phone
      ),
    });
    console.log("activeCalls: ", activeCalls.data);

    const extendedBatchContactsWithSid = batchContacts.map(
      (batchContact: Contact) => {
        const call = activeCalls.data.find((activeCall: any) => {
          return batchContact.mobile_phone === activeCall.phoneNumber;
        });

        return { ...batchContact, callSid: call.callSid };
      }
    );

    setSessions(
      batchContacts.map((contact: Contact) => ({
        id: contact.id,
        active: true,
        status: "Dialing",
        name: `${contact.first_name} ${contact.last_name}`,
        company: contact.company,
        phone: contact.mobile_phone,
      }))
    );
    console.log("extendedBatchContactsWithSid: ", extendedBatchContactsWithSid);
    setCurrentBatch(extendedBatchContactsWithSid);
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

  const saveResult = async (contact: Contact, result: string) => {
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

  // 1. Active call disconnect
  const hangUp = () => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <StatusLine status={status} />
        <Stack direction="row" spacing={2} justifyContent="center">
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
          <DialingCards sessions={sessions} />
        )}
        {!isCampaignFinished && answeredSession && (
          <ActiveDialingCard
            session={answeredSession}
            inputVolume={inputVolume}
            outputVolume={outputVolume}
            hangUp={hangUp}
          />
        )}

        <AudioDevicesList devices={devices} />
      </Stack>
      <Dialog open={showContinueDialog} onClose={handleDialogClose}>
        <DialogTitle>Call Results</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {pendingResultContacts.map((contact) => (
              <Card key={contact._id} variant="outlined" sx={{ my: 1 }}>
                <CardContent>
                  <Typography variant="h6">{contact.lead_name}</Typography>
                  <Typography variant="body2">
                    {contact.mobile_phone}
                  </Typography>
                  <Select
                    value={selectedResults[contact._id] || ""}
                    onChange={(e) =>
                      setSelectedResults((prev) => ({
                        ...prev,
                        [contact._id]: e.target.value,
                      }))
                    }
                    displayEmpty
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    <MenuItem value="" disabled>
                      Select result
                    </MenuItem>
                    {callResults.map((callResult) => (
                      <MenuItem key={callResult.label} value={callResult.label}>
                        {callResult.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography>Short description</Typography>
                  <CustomTextField
                    value={contactNotes[contact._id] || ""}
                    onChange={(e) =>
                      setContactNotes((prev) => ({
                        ...prev,
                        [contact._id]: e.target.value,
                      }))
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={async () => {
              await Promise.all(
                pendingResultContacts.map((c) => {
                  saveResult(c, selectedResults[c._id]);
                })
              );
              setPendingResultContacts([]);
              setSelectedResults({});
              setShowContinueDialog(false);
              maybeProceedWithNextBatch();
            }}
            disabled={
              pendingResultContacts.length === 0 ||
              pendingResultContacts.some((c) => !selectedResults[c._id])
            }
          >
            Save and continue
          </Button>
          <Button onClick={handleStopCampaign} color="error" variant="outlined">
            Stop campaign
          </Button>
        </DialogActions>
      </Dialog>
      {isCampaignFinished && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Call campaign completed!
        </Alert>
      )}
    </Container>
  );
};

export default TwilioDevice;
