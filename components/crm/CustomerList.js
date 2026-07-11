"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CustomerCard from "./CustomerCard";

export default function CustomerList({ groupId, status, onStatusChange }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);

  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const fetchPage = useCallback(
    async (pageNum, replace = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const res = await fetch(
          `/api/crm/customers?group_id=${groupId}&status=${status}&page=${pageNum}`
        );
        const json = await res.json();
        if (!res.ok) return;

        setTotal(json.total);
        setItems((prev) => {
          const merged = replace ? json.data : [...prev, ...json.data];
          // ID bazlı tekilleştir
          const seen = new Set();
          const unique = merged.filter((c) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });
          setHasMore(unique.length < json.total);
          return unique;
        });

        if (replace && json.data.length > 0) {
          setOpenId(json.data[0].id);
        }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [groupId, status]
  );

  // Status veya group değişince sıfırla
  useEffect(() => {
    pageRef.current = 0;
    loadingRef.current = false;
    setItems([]);
    setTotal(null);
    setHasMore(true);
    setOpenId(null);
    fetchPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, status]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          fetchPage(nextPage);
        }
      },
      // Daha erken tetikle: kullanıcı dibe yaklaşınca yükle
      { threshold: 0.01, rootMargin: "200px 0px" }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, fetchPage, items.length]);

  function handleToggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function handleSaved(oldStatus, updated) {
    onStatusChange?.(oldStatus, updated.status);
    setItems((prev) => {
      const filtered = prev
        .map((c) => (c.id === updated.id ? updated : c))
        .filter((c) => c.status === status);

      const nextItem = filtered.find((c) => c.id !== updated.id);
      setOpenId(nextItem?.id ?? null);

      return filtered;
    });
  }

  if (!loading && items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-zinc-400">Bu sekmeye ait müşteri yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <CustomerCard
          key={c.id}
          customer={c}
          isOpen={openId === c.id}
          onToggle={() => handleToggle(c.id)}
          onSaved={(updated) => handleSaved(c.status, updated)}
        />
      ))}

      {loading && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200" />
        </div>
      )}

      {!loading && hasMore && items.length > 0 && (
        <div className="flex justify-center py-4">
          <button
            type="button"
            onClick={() => {
              if (loadingRef.current) return;
              const nextPage = pageRef.current + 1;
              pageRef.current = nextPage;
              fetchPage(nextPage);
            }}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Daha fazla yükle
          </button>
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
