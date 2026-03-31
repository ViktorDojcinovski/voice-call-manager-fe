import { useState } from "react";
import api from "../../../utils/axiosInstance";
import { useSnackbar } from "../../../hooks/useSnackbar";
import useAppStore from "../../../store/useAppStore";
import { Contact } from "../../../types/contact";
import { Step } from "../../../interfaces/list-dialing-step";

const MAX_LISTS_PER_USER = 10;

const useListManager = () => {
  const { enqueue } = useSnackbar();
  const deleteList = useAppStore((state) => state.deleteList);
  const fetchLists = useAppStore((state) => state.fetchLists);
  const lists = useAppStore((state) => state.lists);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [selectedCalls, setSelectedCalls] = useState<Record<string, string>>(
    {}
  );
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [deletingList, setDeletingList] = useState(false);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [eligibleContacts, setEligibleContacts] = useState<{
    [listId: string]: { [stepIndex: number]: Contact[] };
  }>({});
  const [loadingContactsForListId, setLoadingContactsForListId] = useState<
    string | null
  >(null);

  const fetchEligibleContacts = async (listId: string, steps: Step[]) => {
    setLoadingContactsForListId(listId);
    try {
      // Fetch all steps in parallel instead of sequentially
      const results = await Promise.all(
        steps.map((_, i) =>
          api
            .post(`/lists/${listId}/step/${i + 1}/contacts`)
            .then((res) => res.data)
            .catch(() => [] as Contact[])
        )
      );

      const resultsMap: { [stepIndex: number]: Contact[] } = {};
      results.forEach((data, i) => {
        resultsMap[i] = data;
      });

      setEligibleContacts((prev) => ({ ...prev, [listId]: resultsMap }));
    } finally {
      setLoadingContactsForListId(null);
    }
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

  const handleDelete = async (deleteContacts: boolean) => {
    if (!listToDelete) return;
    setDeletingList(true);
    try {
      await deleteList(listToDelete, { deleteContacts });
      enqueue(
        deleteContacts
          ? "List and its contacts were deleted"
          : "List removed; contacts are now unassigned",
        { variant: "success" }
      );
      setOpenDialog(false);
      setListToDelete(null);
    } catch {
      enqueue("Failed to delete list", { variant: "error" });
    } finally {
      setDeletingList(false);
    }
  };

  const handleClone = async (listId: string) => {
    if (cloningId) return;
    if ((lists?.length ?? 0) >= MAX_LISTS_PER_USER) {
      enqueue(
        `Maximum ${MAX_LISTS_PER_USER} lists per user. Delete a list to clone.`,
        { variant: "error" }
      );
      return;
    }
    setCloningId(listId);
    try {
      await api.post(`/lists/${listId}/duplicate`);
      enqueue("List duplicated successfully", { variant: "success" });
      await fetchLists();
    } catch {
      enqueue("Failed to duplicate list", { variant: "error" });
    } finally {
      setCloningId(null);
    }
  };

  const handleRefreshContactsForList = async (
    listId: string,
    steps?: Step[]
  ) => {
    if (steps?.length) {
      await fetchEligibleContacts(listId, steps);
    }
    await fetchLists();
  };

  const atListLimit = (lists?.length ?? 0) >= MAX_LISTS_PER_USER;

  return {
    selectedCalls,
    expandedListId,
    eligibleContacts,
    loadingContactsForListId,
    atListLimit,
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
    handleClone,
    cloningId,
    handleRefreshContactsForList,
    listToDelete,
    deletingList,
  };
};

export default useListManager;
