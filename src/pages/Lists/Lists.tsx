import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Box, Typography } from "@mui/material";

import { SimpleButton } from "../../components/UI/SimpleButton";
import useAppStore from "../../store/useAppStore";
import useListManager from "./useListManager";
import ListCard from "./components/ListCard";
import DeleteDialog from "./components/DeleteDialog";

const Lists = () => {
  const navigate = useNavigate();
  const lists = useAppStore((state) => state.lists);
  const fetchLists = useAppStore((state) => state.fetchLists);

  const {
    selectedCalls,
    expandedListId,
    eligibleContacts,
    handleExpand,
    handleConnectionChange,
    anchorEl,
    menuListId,
    openMenu,
    closeMenu,
    openDialog,
    setOpenDialog,
    handleDeleteClick,
    handleDelete,
    listToDelete,
  } = useListManager();

  useEffect(() => {
    fetchLists();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="right">
        <SimpleButton
          label="Import New Contacts"
          onClick={() => navigate("/dashboard/import-contacts")}
        />
        <SimpleButton
          label="Create New List"
          onClick={() => navigate("/dashboard/create-new-list")}
        />
      </Box>

      <Box m={5} p={5}>
        <Typography variant="h1" fontSize={24} mb={5} ml={2}>
          Contacts' Lists
        </Typography>

        {lists &&
          lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              selectedCall={selectedCalls[list.id]}
              expanded={expandedListId === list.id}
              eligibleContacts={eligibleContacts[list.id]}
              onExpand={handleExpand}
              onConnectionClick={openMenu}
              onConnectionChange={handleConnectionChange}
              anchorEl={anchorEl}
              menuListId={menuListId}
              closeMenu={closeMenu}
              onDeleteClick={handleDeleteClick}
            />
          ))}
      </Box>

      <DeleteDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={handleDelete}
      />
    </Container>
  );
};

export default Lists;
