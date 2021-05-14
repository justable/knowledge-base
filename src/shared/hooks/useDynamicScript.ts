import { useState, useEffect } from 'react';

export default function useDynamicScript(url: string, globalName: string) {
  //@ts-ignore
  const [source, setSource] = useState(() => window[globalName]);
  useEffect(() => {
    if (source) return;
    const script = document.createElement('script');
    script.src = url;
    script.onload = function() {
      //@ts-ignore
      setSource(() => window[globalName]);
    };
    document.head.appendChild(script);
  }, []);
  return [source];
}
