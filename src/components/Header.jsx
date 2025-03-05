import { AppBar, Toolbar, Button } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { signout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    try {
      signout();
      navigate("/");
    } catch (error) {
      console.error("Signout failed: ", error);
    }
  };

  return (
    <AppBar>
      <Toolbar>
        <Button color="inherit" onClick={handleSignOut}>
          SignOut
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
