import { useEffect, useRef } from "react";
import { MonacoBinding } from "y-monaco";

export function useMonacoBinding(yText) {
  const bindingRef = useRef(null);

  const handleMount = (editor) => {
    bindingRef.current?.destroy();

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor])
    );
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [yText]);

  return {
    handleMount,
  };
}