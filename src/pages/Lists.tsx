import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Card, CardContent } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

import api from "../utils/axiosInstance";

import { SimpleButton } from "../components/UI/SimpleButton";

const Lists = () => {
  const navigate = useNavigate();
  const [lists, setLists] = useState<any[]>();

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const { data } = await api.get("/lists");

        setLists(data);
      } catch (error) {
        console.error("Error fetching list: ", error);
      }
    };

    fetchLists();
  }, []);

  const handleEdit = (id: string) => {
    console.log(id);
  };

  const handleDelete = (id: string) => {
    console.log(id);
  };

  return (
    <>
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
      <Box border="1px solid #eee" m={5} p={5}>
        <Typography variant="h1" fontSize={24} mb={5} ml={2}>
          Lists
        </Typography>
        {lists &&
          lists.map((list) => (
            <Card key={list.id} sx={{ marginBottom: 2 }}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">{list.listName}</Typography>
                  <Box display="flex">
                    <IconButton onClick={() => handleEdit(list.id)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(list.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
      </Box>
    </>
  );
};

export default Lists;
