"use client";
import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api/use-query";
import {
  operations,
  schemas,
  type OperationId,
} from "@/lib/admin-api/contract";
import type { Inputs, Page } from "@/lib/admin-api/types";
import type { PathParams, Query } from "@/lib/admin-api/validation";
import { Filters } from "./filters";
import { RecordDetails, RecordTable, record } from "./records";
import { Empty, Failure, Loading, Snapshot } from "./feedback";
type ReadOperation = {
  [K in OperationId]: (typeof operations)[K]["method"] extends "GET"
    ? K
    : never;
}[OperationId];
export function DataRegion({
  operation,
  params = {},
  initial = {},
  locked = [],
  filterable = true,
}: {
  operation: ReadOperation;
  params?: PathParams;
  initial?: Query;
  locked?: string[];
  filterable?: boolean;
}) {
  const [query, setQuery] = useState<Query>(initial);
  const [cursors, setCursors] = useState<Array<string | undefined>>([
    undefined,
  ]);
  const [index, setIndex] = useState(0);
  const input = {
    params,
    query: { ...query, ...(index ? { cursor: cursors[index] } : {}) },
  } as Inputs[typeof operation];
  const result = useAdminQuery(operation, input);
  const change = (next: Query) => {
    setQuery(next);
    setCursors([undefined]);
    setIndex(0);
  };
  const schema = operations[operation].response;
  const payload = result.response?.data;
  const object =
    payload && !Array.isArray(payload) ? record(payload) : undefined;
  const items = object?.items as object[] | undefined;
  const page = object?.page as Page | undefined;
  const itemSchema = schemas[schema].properties?.items?.items?.$ref
    ?.split("/")
    .at(-1);
  const filtered = Object.entries(query).some(
    ([key, value]) => value && !["limit", "sort"].includes(key),
  );
  return (
    <section className="hm-panel">
      {filterable && operations[operation].query.length > 0 && (
        <Filters
          operation={operation}
          query={query}
          params={params}
          locked={locked}
          onChange={change}
        />
      )}{" "}
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <>
          <Failure error={result.error} retry={result.retry} />
          {index > 0 && (
            <button
              className="hm-button hm-secondary"
              onClick={() => change(query)}
            >
              Về trang đầu (khôi phục cursor)
            </button>
          )}
        </>
      ) : (
        payload && (
          <>
            {items ? (
              items.length ? (
                <RecordTable schema={itemSchema!} items={items} />
              ) : (
                <Empty filtered={filtered} />
              )
            ) : (
              <RecordDetails schema={schema} value={payload} />
            )}{" "}
            {page && (
              <div className="hm-pagination">
                <span>
                  Trang {index + 1} · {items?.length} bản ghi trên trang · Không
                  có tổng số từ API
                </span>
                <div>
                  <button
                    className="hm-button hm-secondary"
                    disabled={index === 0}
                    onClick={() => setIndex((value) => value - 1)}
                  >
                    Trang trước
                  </button>
                  <button
                    className="hm-button hm-secondary"
                    disabled={!page.hasMore || !page.nextCursor}
                    onClick={() => {
                      setCursors((previous) => [
                        ...previous.slice(0, index + 1),
                        page.nextCursor!,
                      ]);
                      setIndex((value) => value + 1);
                    }}
                  >
                    Trang tiếp
                  </button>
                </div>
              </div>
            )}
            <Snapshot meta={result.response!.meta} />
          </>
        )
      )}
    </section>
  );
}
