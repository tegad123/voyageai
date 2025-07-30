// AppEntryPatch.js – must run before Expo‑Router bootstraps
import React from 'react';

const oldCreate = React.createElement;
React.createElement = (type, props, ...children) => {
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === large) {
        console.warn(
          🚨 BAD PROP (early‑patch) →',
          type?.displayName || type?.name || type,
          `prop ${k}= "large"`
        );
      }
    }
  }
  return oldCreate(type, props, ...children);
};

// **Important:** export anything so the file is a valid module
export {}; 