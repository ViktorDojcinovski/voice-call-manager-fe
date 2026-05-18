import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Stack,
  Container,
  CircularProgress,
  Box,
  Button,
} from "@mui/material";
import { TelephonyConnection } from "voice-javascript-common";

import { useAuth } from "../../../contexts/AuthContext";
import { useCampaignCall } from "../../../contexts/CampaignCallContext";
import type { CampaignLocationState } from "../../../features/campaign/campaignCallRouteUtils";
import { Contact } from "../../../types/contact";
import {
  getDialingSessionsWithStatuses,
} from "../../../utils/getDialingSessionsWithStatuses";
import DialingCards from "./components/DialingCards";
import SingleCallCampaignPanel from "./components/SingleCallCampaign";
import MinimalCallPanel from "./components/MinimalCallPanel";
import { campaignV2 } from "./components/campaignV2Tokens";
import theme from "../../../theme";

const Campaign = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authLoading, isAuthenticated } = useAuth();

  const {
    startFromNavigation,
    manualSession,
    sessionToShow,
    answeredSession,
    contactDetailsLoading,
    activityTimelineRefreshKey,
    callStarted,
    dialerState,
    isCampaignRunning,
    isCampaignFinished,
    isSocketReady,
    error,
    oneOffPhoneString,
    phone,
    contacts,
    mode,
    contactId,
    effectiveContactId,
    resolvedMode,
    currentBatch,
    ringingSessions,
    pendingResultContacts,
    singleSession,
    handleStartCampaign,
    handleStopCampaign,
    hangUp,
    handleNumpadClick,
    setCurrentBatch,
    refreshManualSession,
    refreshSessionToShow,
    onManualPanelStartCall,
  } = useCampaignCall();

  const shouldRedirect = !authLoading && !isAuthenticated;

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/dashboard", { replace: true, state: { from: location } });
    }
  }, [shouldRedirect, navigate, location]);

  useEffect(() => {
    const state = location.state as CampaignLocationState | null;
    if (state) {
      startFromNavigation(state);
    }
  }, [location.state, startFromNavigation]);

  const headerBelowBatch =
    !contactId && !phone && contacts && contacts.length > 0 ? (
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        justifyContent="flex-start"
      >
        <Button
          variant="contained"
          onClick={handleStartCampaign}
          disabled={!isSocketReady || isCampaignRunning}
          sx={{
            px: 3,
            textTransform: "none",
            fontWeight: 700,
            color: "#fff",
            boxShadow: campaignV2.ctaShadow,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
              color: "#fff",
            },
            "&.Mui-disabled": {
              color: "rgba(255, 255, 255, 0.65)",
            },
          }}
        >
          Start campaign
        </Button>
        <Button
          variant="outlined"
          onClick={handleStopCampaign}
          disabled={!isCampaignRunning}
          sx={{
            px: 3,
            textTransform: "none",
            fontWeight: 700,
            borderColor: campaignV2.accent,
            color: campaignV2.accent,
            "&:hover": {
              borderColor: campaignV2.accentDark,
              bgcolor: campaignV2.subtleFill,
            },
          }}
        >
          Stop campaign
        </Button>
      </Stack>
    ) : null;

  const campaignAlerts =
    !isSocketReady || error ? (
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        {!isSocketReady && (
          <Alert severity="warning">
            Reconnecting to real-time service… You can’t start a campaign until
            it’s ready.
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    ) : null;

  return (
    <Container
      maxWidth={false}
      sx={{ py: 3, bgcolor: campaignV2.pageBg, minHeight: "100%" }}
    >
      {contactDetailsLoading &&
        effectiveContactId &&
        !manualSession &&
        !(contacts && contacts.length > 0) && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={6}
            width="100%"
          >
            <CircularProgress />
          </Box>
        )}
      <Stack spacing={3}>
        {!contactId && !phone && headerBelowBatch}
        {campaignAlerts}

        {phone != null && phone !== "" && !manualSession && (
          <MinimalCallPanel phone={oneOffPhoneString} />
        )}

        {manualSession && (
          <SingleCallCampaignPanel
            session={manualSession}
            answeredSession={answeredSession as Contact}
            headerRight={null}
            headerBelowCallBar={headerBelowBatch ?? undefined}
            headerAlerts={campaignAlerts ?? undefined}
            timelineRefreshKey={activityTimelineRefreshKey}
            onStartCall={onManualPanelStartCall}
            onEndCall={hangUp}
            onAccountUpdated={refreshManualSession}
            onListMembershipChanged={refreshManualSession}
            manual={true}
            phone={oneOffPhoneString || undefined}
            callStarted={callStarted}
            isStartCallDisabled={!isSocketReady}
            handleNumpadClick={handleNumpadClick}
          />
        )}

        {!phone && !manualSession && (
          <>
            {sessionToShow && resolvedMode === TelephonyConnection.SOFT_CALL && (
              <SingleCallCampaignPanel
                session={sessionToShow}
                answeredSession={
                  dialerState === "IN_CALL"
                    ? (answeredSession as Contact)
                    : null
                }
                headerRight={null}
                headerBelowCallBar={headerBelowBatch ?? undefined}
                headerAlerts={campaignAlerts ?? undefined}
                timelineRefreshKey={activityTimelineRefreshKey}
                onEndCall={hangUp}
                onAccountUpdated={refreshSessionToShow}
                onListMembershipChanged={refreshSessionToShow}
                manual={false}
                callStarted={
                  !isCampaignFinished &&
                  (dialerState === "DIALING" || dialerState === "IN_CALL")
                }
                handleNumpadClick={handleNumpadClick}
              />
            )}
            {!isCampaignFinished &&
              isCampaignRunning &&
              mode === TelephonyConnection.SOFT_CALL &&
              !singleSession &&
              dialerState === "IDLE" &&
              currentBatch.length > 0 && (
                <DialingCards
                  sessions={getDialingSessionsWithStatuses(
                    currentBatch,
                    ringingSessions,
                    pendingResultContacts
                  )}
                />
              )}
          </>
        )}
      </Stack>
    </Container>
  );
};

export default Campaign;
