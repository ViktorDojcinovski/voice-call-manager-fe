import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import api from "../../utils/axiosInstance";

import ContactCard from "../../components/ContactCard";
import { Contact } from "../../types/contact";

const ContactsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const contactIds: { _id: string; userId: string }[] =
    location.state?.contacts || [];

  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (contactIds.length > 0) {
      // Replace with real API call
      const ids = contactIds.map((contactId) => contactId._id);
      const fetchContacts = async () => {
        const { data } = await api.post("/contacts/batch", {
          ids,
        });

        setContacts(data);
      };

      fetchContacts();
    }
  }, [contactIds]);

  return (
    <Box display="flex" flexDirection="column" gap={1} m={5} p={5}>
      <Typography variant="h1" fontSize={24} mb={5} ml={2}>
        Contacts Batch
      </Typography>
      {contacts.map((contact) => (
        <ContactCard
          contact={contact}
          onDeleteClick={(id) => console.log("Delete contact with ID:", id)}
        />
      ))}
    </Box>
  );
};

export default ContactsPage;
