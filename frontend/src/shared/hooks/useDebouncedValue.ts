import { useEffect, useState } from "react";

export function useDebouncedValue<T>(valor: T, demora = 250): T {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setDebounced(valor), demora);
    return () => window.clearTimeout(temporizador);
  }, [valor, demora]);

  return debounced;
}
