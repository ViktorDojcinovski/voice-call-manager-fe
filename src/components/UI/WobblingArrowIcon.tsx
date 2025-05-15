import { IconButton } from "@mui/material";
import { PlayArrow } from "@mui/icons-material";

const wobbleKeyframes = `
  @keyframes wobble {
    0% { transform: scale(1); }
    25% { transform: scale(1.1); }
    50% { transform: scale(1.0); }
    75% { transform: scale(1.1); }
    100% { transform: scale(1.0); }
  }
`;

const WobblingIconButton = () => {
  return (
    <>
      <style>{wobbleKeyframes}</style>
      <IconButton
        sx={{
          animation: "wobble 1s infinite",
          color: "green",
          "&:hover": {
            backgroundColor: "transparent", // Remove the background on hover
          },
        }}
      >
        <PlayArrow />
      </IconButton>
    </>
  );
};

export default WobblingIconButton;
