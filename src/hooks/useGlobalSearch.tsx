// src/hooks/useGlobalSearch.ts
import { useState, useCallback } from "react";
import _ from "lodash";

import api from "../utils/axiosInstance";

export interface SearchResult {
  id: string;
  label: string;
  accountName?: string;
  phone?: string;
}

export function useGlobalSearch() {
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(
    _.debounce(async (q: string) => {
      setLoading(true);
      try {
        const res = await api.get("/contacts", {
          params: { search: q, limit: 5 },
        });
        const data: SearchResult[] = res.data.data.map((c: any) => ({
          id: c.id,
          label: `${c.first_name} ${c.last_name}`,
          accountName: c.account?.companyName ?? "",
          phone: c.phone ?? "",
        }));
        setOptions(data);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  return { options, loading, fetch };
}
