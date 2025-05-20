import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  Typography,
  Divider,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import ContactCard from "../../../components/ContactCard";

const ContactDialog = ({ open, onClose, contacts }: any) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <Box
        display="flex"
        alignContent="space-between"
        flexDirection="row"
        alignItems="center"
        px={2}
        py={1}
      >
        <DialogTitle
          sx={{
            flex: 1,
            m: 0,
            p: 0,
            fontSize: "1.25rem",
            fontWeight: 500,
          }}
        >
          Contacts
        </DialogTitle>
        <Close onClick={onClose} sx={{ cursor: "pointer" }} />
      </Box>
      <Divider />
      <DialogContent>
        {contacts?.length > 0 ? (
          <List dense>
            {contacts.map((contact: any, idx: number) => (
              <ContactCard contact={contact} onDeleteClick={() => {}} />
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No contacts available.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
