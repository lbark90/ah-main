"use client";

import { useEffect } from 'react';

export default function ConversationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Apply the background color directly
    document.documentElement.style.backgroundColor = '#0f172a';
    document.body.style.backgroundColor = '#0f172a';

    // Force all containers with different background colors to match
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const bgColor = computedStyle.backgroundColor;

      // If the element has a darker blue background, force it to our target color
      if (bgColor.includes('rgb(10,') || bgColor.includes('rgb(2,') ||
        bgColor.includes('rgba(10,') || bgColor.includes('rgba(2,')) {
        if (el instanceof HTMLElement) {
          el.style.backgroundColor = '#0f172a';
        }
      }
    });

    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return <div className="bg-[#0f172a]">{children}</div>;
}
