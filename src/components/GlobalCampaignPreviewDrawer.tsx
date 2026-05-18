import { Drawer, Box, IconButton, Typography } from "@mui/material";
import Close from "@mui/icons-material/Close";
import { useCampaignCall } from "../contexts/CampaignCallContext";
import SingleCallCampaignPanel from "../pages/admin/Campaign/components/SingleCallCampaign";
import { Contact } from "../types/contact";

export default function GlobalCampaignPreviewDrawer() {
  const {
    isPreviewDrawerOpen,
    closePreviewDrawer,
    manualSession,
    sessionToShow,
    answeredSession,
    activityTimelineRefreshKey,
    onManualPanelStartCall,
    hangUp,
    refreshManualSession,
    refreshSessionToShow,
    oneOffPhoneString,
    callStarted,
    isSocketReady,
    handleNumpadClick,
    dialerState,
    isCampaignFinished,
  } = useCampaignCall();

  const panelSession = manualSession ?? sessionToShow;
  if (!panelSession) return null;

  const isManual = !!manualSession;
  const showAnswered =
    dialerState === "IN_CALL" ? (answeredSession as Contact) : null;

  return (
    <Drawer
      anchor="right"
      open={isPreviewDrawerOpen}
      onClose={closePreviewDrawer}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 480, md: 640 }, maxWidth: "100vw" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Contact preview
        </Typography>
        <IconButton onClick={closePreviewDrawer} aria-label="Close preview">
          <Close />
        </IconButton>
      </Box>
      <Box sx={{ overflow: "auto", flex: 1, p: 2 }}>
        <SingleCallCampaignPanel
          session={panelSession}
          answeredSession={showAnswered}
          headerRight={null}
          timelineRefreshKey={activityTimelineRefreshKey}
          onStartCall={isManual ? onManualPanelStartCall : undefined}
          onEndCall={hangUp}
          onAccountUpdated={async () => {
            if (isManual) await refreshManualSession();
            else await refreshSessionToShow();
          }}
          onListMembershipChanged={async () => {
            if (isManual) await refreshManualSession();
            else await refreshSessionToShow();
          }}
          manual={isManual}
          phone={oneOffPhoneString || undefined}
          callStarted={
            isManual
              ? callStarted
              : !isCampaignFinished &&
                (dialerState === "DIALING" || dialerState === "IN_CALL")
          }
          isStartCallDisabled={!isSocketReady}
          handleNumpadClick={handleNumpadClick}
        />
      </Box>
    </Drawer>
  );
}
