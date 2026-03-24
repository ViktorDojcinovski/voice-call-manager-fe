import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Link,
  IconButton,
} from "@mui/material";
import { Business, ExpandMore as ExpandMoreIcon, Edit } from "@mui/icons-material";
import { Contact } from "../../../../types/contact";
import { formatWebsiteToDomain } from "../../../../utils/formatWebsiteDomain";

interface AccountFieldsCardProps {
  contact: Contact;
  defaultExpanded?: boolean;
  onEditAccount?: () => void;
}

const CARD_STYLES = {
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  "&:before": { display: "none" },
};

export function AccountFieldsCard({
  contact,
  defaultExpanded = true,
  onEditAccount,
}: AccountFieldsCardProps) {
  const account = contact.account;
  const fields = [
    { label: "Account Name", value: account?.companyName },
    { label: "Website", value: account?.website, isLink: true },
    { label: "AmazonStorefrontURL", value: (account as any)?.amazonStorefrontURL, isLink: true },
    { label: "Description", value: account?.description },
  ].filter((f) => f.value && String(f.value).trim());

  const count = fields.length;

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      sx={CARD_STYLES}
      elevation={0}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 1,
          },
        }}
      >
        <Business sx={{ fontSize: 20, color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Account Fields
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          ({count})
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box display="flex" alignItems="flex-start" sx={{ py: 0.5 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography fontSize={13} fontWeight={500} color="text.secondary">
                  Account
                </Typography>
                {onEditAccount && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAccount();
                    }}
                    sx={{ minWidth: "auto", p: 0.25 }}
                    title="Edit account"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography fontSize={13} sx={{ mt: 0.5 }}>
                {account?.companyName || "—"}
              </Typography>
              {account?.website && (
                <Link
                  href={
                    account.website.startsWith("http")
                      ? account.website
                      : `https://${account.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize={13}
                  sx={{ mt: 0.5, display: "block", color: "primary.main" }}
                >
                  {formatWebsiteToDomain(account.website)}
                </Link>
              )}
              {(account as any)?.amazonStorefrontURL && (
                <Link
                  href={
                    (account as any).amazonStorefrontURL.startsWith("http")
                      ? (account as any).amazonStorefrontURL
                      : `https://${(account as any).amazonStorefrontURL}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize={13}
                  sx={{ mt: 0.5, display: "block", color: "primary.main" }}
                >
                  {formatWebsiteToDomain((account as any).amazonStorefrontURL)}
                </Link>
              )}
              <Typography fontSize={13} sx={{ mt: 0.5 }} color="text.secondary">
                {account?.description || "—"}
              </Typography>
            </Box>
          </Box>
          {fields.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No account fields
            </Typography>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
