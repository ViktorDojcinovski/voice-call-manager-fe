import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link } from "react-router-dom";

import api from "../../utils/axiosInstance";

type NumberRecord = {
  number: string;
  friendlyName?: string;
  assigned: boolean;
  released: boolean;
};

type DialRightData = Record<string, unknown> | undefined;

type ScanRecord = {
  id: string;
  phoneNumber: string;
  scannedAt: string;
  success: boolean;
  data?: DialRightData;
  errorMessage?: string;
};

function pickScore(data: DialRightData): number | string | null {
  if (!data || typeof data !== "object") return null;
  const v = (data as { dialright_score?: unknown }).dialright_score;
  if (v === null || v === undefined) return null;
  return typeof v === "number" || typeof v === "string" ? v : null;
}

export default function DialRightScans() {
  const [manualPhone, setManualPhone] = useState("");
  const [manualLastContact, setManualLastContact] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualResult, setManualResult] = useState<unknown>(null);

  const [numbers, setNumbers] = useState<NumberRecord[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [batchDefaultLastContact, setBatchDefaultLastContact] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSummary, setBatchSummary] = useState<{
    total: number;
    succeeded: number;
    failed: number;
  } | null>(null);
  const [batchResults, setBatchResults] = useState<unknown[] | null>(null);

  const [historyFilter, setHistoryFilter] = useState("");
  const [historyItems, setHistoryItems] = useState<ScanRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const loadNumbers = useCallback(async () => {
    setPoolLoading(true);
    try {
      const res = await api.get("/numbers");
      setNumbers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setPoolLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNumbers();
  }, [loadNumbers]);

  useEffect(() => {
    const t = setTimeout(() => {
      (async () => {
        setHistoryLoading(true);
        try {
          const params = new URLSearchParams();
          params.set("limit", "50");
          if (historyFilter.trim()) {
            params.set("phone", historyFilter.trim());
          }
          const res = await api.get(`/dialright/scans?${params.toString()}`);
          setHistoryItems(res.data.items || []);
          setHistoryTotal(res.data.total ?? 0);
        } catch (e: unknown) {
          console.error(e);
        } finally {
          setHistoryLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [historyFilter]);

  const refreshHistory = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (historyFilter.trim()) {
      params.set("phone", historyFilter.trim());
    }
    const res = await api.get(`/dialright/scans?${params.toString()}`);
    setHistoryItems(res.data.items || []);
    setHistoryTotal(res.data.total ?? 0);
  }, [historyFilter]);

  const handleManualScan = async () => {
    setManualError(null);
    setManualResult(null);
    setManualLoading(true);
    try {
      const body: Record<string, string> = { phoneNumber: manualPhone };
      if (manualLastContact.trim()) {
        body.lastPointContact = manualLastContact.trim();
      }
      const res = await api.post("/dialright/scan", body);
      setManualResult(res.data);
      await refreshHistory();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setManualError(
        err.response?.data?.error || "Scan failed. Check API key and balance.",
      );
    } finally {
      setManualLoading(false);
    }
  };

  const toggleSelect = (n: string) => {
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );
  };

  const handleBatchScan = async () => {
    setBatchSummary(null);
    setBatchResults(null);
    setBatchLoading(true);
    try {
      const lastPointContactByNumber: Record<string, string> = {};
      if (batchDefaultLastContact.trim()) {
        for (const n of selected) {
          lastPointContactByNumber[n] = batchDefaultLastContact.trim();
        }
      }
      const res = await api.post("/dialright/scan/batch", {
        numbers: selected,
        ...(Object.keys(lastPointContactByNumber).length
          ? { lastPointContactByNumber }
          : {}),
      });
      setBatchSummary(res.data.summary);
      setBatchResults(res.data.results);
      await refreshHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setBatchLoading(false);
    }
  };

  const renderDataSummary = (data: DialRightData) => {
    if (!data) return <Typography color="text.secondary">No data</Typography>;
    const d = data as Record<string, unknown>;
    const rows: [string, string][] = [
      ["DialRight score", String(d.dialright_score ?? "—")],
      ["Risk level", String(d.risk_level ?? "—")],
      ["Line type", String(d.line_type ?? "—")],
      ["Carrier", String(d.carrier ?? "—")],
      ["Valid", String(d.is_valid ?? "—")],
      ["DNC federal", String(d.dnc_fed_number ?? "—")],
      ["DNC state", String(d.dnc_state_number ?? "—")],
      ["Litigator", String(d.likely_litigator_associated ?? "—")],
    ];
    const reassigned = d.reassigned_numbers_result as
      | Record<string, unknown>
      | undefined;
    return (
      <Box
        component="dl"
        sx={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 0.5 }}
      >
        {rows.map(([k, v]) => (
          <Box key={k} sx={{ display: "contents" }}>
            <Typography component="dt" variant="body2" color="text.secondary">
              {k}
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0 }}>
              {v}
            </Typography>
          </Box>
        ))}
        {reassigned && (
          <>
            <Typography component="dt" variant="body2" color="text.secondary">
              Reassigned
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0 }}>
              {JSON.stringify(reassigned)}
            </Typography>
          </>
        )}
      </Box>
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h5" mb={1}>
        DialRight scans
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Caller ID Reputation DialRight API — single scan, batch from pool, and
        local history.{" "}
        <Link to="/superdashboard">Back to superadmin dashboard</Link>
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          Manual scan
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="flex-start">
          <TextField
            label="Phone number"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            placeholder="+1 555 123 4567"
            size="small"
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="Last point of contact (optional)"
            value={manualLastContact}
            onChange={(e) => setManualLastContact(e.target.value)}
            placeholder="YYYY-MM-DD"
            size="small"
            helperText="For reassigned-numbers source"
            sx={{ minWidth: 220 }}
          />
          <Button
            variant="contained"
            onClick={handleManualScan}
            disabled={manualLoading || !manualPhone.trim()}
            sx={{ mt: 0.5 }}
          >
            {manualLoading ? <CircularProgress size={22} /> : "Scan"}
          </Button>
        </Box>
        {manualError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {manualError}
          </Alert>
        )}
        {manualResult && (
          <Box mt={2}>
            {renderDataSummary(
              (manualResult as { dialright?: { data?: DialRightData } })
                ?.dialright?.data,
            )}
            <Box mt={1}>
              <Typography variant="caption" color="text.secondary" display="block">
                Raw response
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  p: 1,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  fontSize: 12,
                  overflow: "auto",
                  maxHeight: 240,
                }}
              >
                {JSON.stringify(manualResult, null, 2)}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          Scan from number pool
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          <Button variant="outlined" onClick={loadNumbers} disabled={poolLoading}>
            {poolLoading ? "Loading…" : "Refresh pool"}
          </Button>
          <TextField
            label="Default last contact (batch)"
            value={batchDefaultLastContact}
            onChange={(e) => setBatchDefaultLastContact(e.target.value)}
            placeholder="YYYY-MM-DD"
            size="small"
            sx={{ minWidth: 220 }}
          />
          <Button
            variant="contained"
            color="secondary"
            disabled={!selected.length || batchLoading}
            onClick={handleBatchScan}
          >
            {batchLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              `Scan selected (${selected.length})`
            )}
          </Button>
        </Box>
        {batchSummary && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Batch: {batchSummary.succeeded} succeeded, {batchSummary.failed}{" "}
            failed (of {batchSummary.total})
          </Alert>
        )}
        {batchResults && (
          <Box
            component="pre"
            sx={{
              p: 1,
              bgcolor: "grey.100",
              borderRadius: 1,
              fontSize: 11,
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            {JSON.stringify(batchResults, null, 2)}
          </Box>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Number</TableCell>
              <TableCell>Friendly name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {numbers.map((num) => (
              <TableRow key={num.number}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(num.number)}
                    onChange={() => toggleSelect(num.number)}
                    disabled={!!num.released}
                  />
                </TableCell>
                <TableCell>{num.number}</TableCell>
                <TableCell>{num.friendlyName || "—"}</TableCell>
                <TableCell>
                  {num.released ? "Released" : num.assigned ? "Assigned" : "Pool"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" color="primary" gutterBottom>
          Scan history
        </Typography>
        <TextField
          label="Filter by phone"
          value={historyFilter}
          onChange={(e) => setHistoryFilter(e.target.value)}
          size="small"
          sx={{ mb: 2, minWidth: 280 }}
        />
        {historyLoading ? (
          <CircularProgress />
        ) : (
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            {historyTotal} record(s)
          </Typography>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={48} />
              <TableCell>Time</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>OK</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historyItems.map((row) => (
              <Fragment key={row.id}>
                <TableRow hover>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() =>
                        setExpandedRow((v) => (v === row.id ? null : row.id))
                      }
                      aria-label="expand"
                    >
                      {expandedRow === row.id ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {row.scannedAt
                      ? new Date(row.scannedAt).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>{row.phoneNumber}</TableCell>
                  <TableCell>{row.success ? "Yes" : "No"}</TableCell>
                  <TableCell>{String(pickScore(row.data) ?? "—")}</TableCell>
                  <TableCell>{row.errorMessage || "—"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                    <Collapse in={expandedRow === row.id}>
                      <Box py={2} px={1}>
                        {renderDataSummary(row.data)}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          mt={2}
                          display="block"
                        >
                          Stored record
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            mt: 0.5,
                            p: 1,
                            bgcolor: "grey.100",
                            borderRadius: 1,
                            fontSize: 11,
                            overflow: "auto",
                            maxHeight: 200,
                          }}
                        >
                          {JSON.stringify(row, null, 2)}
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
