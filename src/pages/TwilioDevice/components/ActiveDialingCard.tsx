import { Box, Grid, Card, CardContent, Typography } from "@mui/material";

import { Contact } from "../../../types/contact";

interface ActiveDialingCardProps {
  // session: Contact;
  inputVolume: number;
  outputVolume: number;
}

const ActiveDialingCard = ({
  // session,
  inputVolume,
  outputVolume,
}: ActiveDialingCardProps) => {
  return (
    <>
      {
        <Grid item xs={12} sm={6} md={4} key={123456}>
          <Card>
            <CardContent>
              <Typography variant="h6">Viktor</Typography>
              <Typography variant="body2">{+38970964932}</Typography>
              <Typography variant="caption">
                Input Volume: {Math.round(inputVolume * 100)}%
              </Typography>
              <br />
              <Typography variant="caption">
                Output Volume: {Math.round(outputVolume * 100)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      }
    </>
  );
};

export default ActiveDialingCard;
