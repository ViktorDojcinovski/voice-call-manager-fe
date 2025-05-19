import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Device, Call } from "@twilio/voice-sdk";
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
import { getAudioDevices } from "../../utils/audioDevice";

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
  const twilioDeviceRef = useRef<Device | null>(null);

  const settings = useAppStore((state) => state.settings);
  if (!settings) {
    throw new Error("Missing settings!");
  }

  const callResults = settings["Phone Settings"].callResults as CallResult[];

  const user = useAppStore((state) => state.user);

  const getDevices = useCallback(async () => {
    if (twilioDeviceRef.current) {
      const devices = await getAudioDevices(twilioDeviceRef.current);
      setDevices(devices);
    }
  }, []);

  function bindVolumeIndicators(call: Call) {
    call.on("volume", (inputVolume: number, outputVolume: number) => {
      setInputVolume(inputVolume);
      setOutputVolume(outputVolume);
    });
  }

  const {
    twilioDevice,
    status,
    sessions,
    inputVolume,
    outputVolume,
    devices,
    currentBatch,
    currentIndex,
    isCampaignRunning,
    isCampaignFinished,
    showContinueDialog,
    pendingResultContacts,
    selectedResults,
    contactNotes,
    answeredSession,
    setDevices,
    setSessions,
    setInputVolume,
    setOutputVolume,
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
    getDevices,
    bindVolumeIndicators,
    userId: user!.id,
  });
  useEffect(() => {
    twilioDeviceRef.current = twilioDevice;
  }, [twilioDevice]);

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

    setCurrentBatch(batchContacts);

    await api.post("/campaign/call-campaign", {
      phoneNumbers: batchContacts.map(
        (contact: Contact) => contact.mobile_phone
      ),
    });
    setSessions(
      batchContacts.map((contact: any) => ({
        id: contact.id,
        active: true,
        status: "Dialing",
        name: `${contact.lead_name}`,
        phone: contact.mobile_phone,
      }))
    );
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
        {/* {!isCampaignFinished && answeredSession && ( */}
        <ActiveDialingCard
          // session={answeredSession}
          inputVolume={inputVolume}
          outputVolume={outputVolume}
        />
        {/* )} */}

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
