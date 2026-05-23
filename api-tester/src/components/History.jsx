import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const History = ({ onClose }) => {
  const { state, setActiveRequest, clearHistory } = useAppContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (state.history.length > 0) {
      setActiveIndex(0);
    }
  }, [state.history.length]);

  const loadByIndex = (index) => {
    const item = state.history[index];
    if (!item) {
      return;
    }
    setActiveRequest({ ...item });
    setActiveIndex(index);
    onClose?.();
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchRef.current.x;
    const deltaY = touch.clientY - touchRef.current.y;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const nextIndex = deltaX < 0 ? activeIndex + 1 : activeIndex - 1;
      if (nextIndex >= 0 && nextIndex < state.history.length) {
        loadByIndex(nextIndex);
      }
    }
  };

  return (
    <div
      className="rounded-2xl border border-gray-800 bg-gray-900 p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">History</span>
        <div className="flex gap-2">
          <button
            className="h-9 rounded-lg bg-gray-800 px-3 text-xs"
            onClick={clearHistory}
          >
            Clear
          </button>
          {onClose && (
            <button
              className="h-9 rounded-lg bg-gray-800 px-3 text-xs"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {state.history.length === 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-xs text-gray-400">
            No history yet. Send a request to get started.
          </div>
        )}
        {state.history.map((item, index) => (
          <button
            key={item.id || `${item.url}-${index}`}
            className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-left text-xs hover:border-blue-600"
            onClick={() => loadByIndex(index)}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-800 px-2 py-1 text-[10px] text-gray-300">
                {item.method}
              </span>
              <span className="flex-1 truncate">{item.url}</span>
            </div>
            {item.createdAt && (
              <div className="mt-1 text-[10px] text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default History;
