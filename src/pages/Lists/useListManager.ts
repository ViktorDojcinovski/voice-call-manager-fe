import { useState } from "react";
import api from "../../utils/axiosInstance";
import useAppStore from "../../store/useAppStore";
import { Contact } from "../../types/contact";
import { Step } from "../../interfaces/list-dialing-step";

const useListManager = () => {
  const deleteList = useAppStore((state) => state.deleteList);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [selectedCalls, setSelectedCalls] = useState<Record<string, string>>(
    {}
  );
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [eligibleContacts, setEligibleContacts] = useState<{
    [listId: string]: { [stepIndex: number]: Contact[] };
  }>({});

  const fetchEligibleContacts = async (listId: string, steps: Step[]) => {
    const results: { [stepIndex: number]: Contact[] } = {};

    for (let i = 0; i < steps.length; i++) {
      try {
        const res = await api.post(`/lists/${listId}/step/${i + 1}/contacts`);
        results[i] = res.data;
      } catch {
        results[i] = [];
      }
    }

    setEligibleContacts((prev) => ({ ...prev, [listId]: results }));
  };

  const handleExpand = (listId: string, steps?: Step[]) => {
    const isExpanding = expandedListId !== listId;
    setExpandedListId(isExpanding ? listId : null);
    if (isExpanding && steps?.length) {
      fetchEligibleContacts(listId, steps);
    }
  };

  const handleConnectionChange = (listId: string, option: string) => {
    setSelectedCalls((prev) => ({ ...prev, [listId]: option }));
    setAnchorEl(null);
    setMenuListId(null);
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(e.currentTarget);
    setMenuListId(id);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuListId(null);
  };

  const handleDeleteClick = (id: string) => {
    setListToDelete(id);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (listToDelete) {
      await deleteList(listToDelete);
      setOpenDialog(false);
      setListToDelete(null);
    }
  };

  return {
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
  };
};

export default useListManager;
