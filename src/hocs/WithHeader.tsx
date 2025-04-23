import { ComponentType } from "react";
import { Box } from "@mui/material";

import Header from "../components/Header";

type WithHeaderProps = {
  component: ComponentType<any>;
};

const WithHeader = ({ component: Component }: WithHeaderProps) => {
  return (
    <>
      <Box sx={{ width: "100%", zIndex: 1000 }}>
        <Header />
      </Box>
      {<Component />}
    </>
  );
};

export default WithHeader;
