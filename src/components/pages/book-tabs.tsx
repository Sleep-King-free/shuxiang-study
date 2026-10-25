'use client';

import { useState } from 'react';
import { bookLists } from '@/lib/content';

const FILTER_LABELS: Record<string, string> = {
  local: '中山本土',
  psychology: '心理',
  growth: '成长',
  fiction: '小说',
};

export default function BookTabs() {
  const [active, setActive] = useState(bookLists[0].id);

  return (
    <>
      <div className="book-toolbar">
        {bookLists.map((list) => (
          <button
            key={list.id}
            type="button"
            className={list.id === active ? 'filter active' : 'filter'}
            data-book-filter={list.id}
            onClick={() => setActive(list.id)}
          >
            {FILTER_LABELS[list.id]}
          </button>
        ))}
      </div>
      {bookLists.map((list) => (
        <div
          key={list.id}
          className={`card book-panel${list.id === active ? ' active' : ''}`}
          data-book-panel={list.id}
        >
          <h3>{list.title}</h3>
          <ol>
            {list.books.map((book) => (
              <li key={book}>{book}</li>
            ))}
          </ol>
        </div>
      ))}
    </>
  );
}
