'use client';

import { useState } from 'react';

const TRUNCATE_LENGTH = 180;

export default function ExpandableDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = description.length > TRUNCATE_LENGTH;

  if (!needsTruncation) {
    return <p className="mt-3 text-sm text-rbx-muted leading-relaxed">{description}</p>;
  }

  return (
    <div className="mt-3">
      <p className={`text-sm text-rbx-muted leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>
        {description}
      </p>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="mt-1.5 rounded text-xs font-semibold text-rbx-orange transition hover:text-white focus-visible:ring-2 focus-visible:ring-rbx-orange active:scale-95"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
}
