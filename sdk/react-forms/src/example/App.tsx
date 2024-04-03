import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import { ProtectedForm, Result, ResultType } from '../..';

const fields = [
  { name: 'card_holder', dataTypeName: 'CC_HOLDER_NAME', label: 'Name', required: true, placeholder: 'John Doe' },
  { name: 'card_number', dataTypeName: 'CC_NUMBER', label: 'Card', required: true, placeholder: '4111 1111 1111 1111' },
  { name: 'card_expiry', dataTypeName: 'CC_EXPIRATION_STRING', label: 'Expiry', required: true, placeholder: '12/34' },
  { name: 'card_cvv', dataTypeName: 'CC_CVV', label: 'CVV', required: true, placeholder: '123' },
];

export function App() {
  const vaultURL = import.meta.env.VITE_VAULT_ENDPOINT;
  const apiKey = import.meta.env.VITE_VAULT_API_KEY;
  const [result, setResult] = useState<string>();
  const onError = useCallback((error: Error) => {
    setResult(error.message);
  }, []);
  const onSubmit = useCallback((value: Result<ResultType>) => {
    setResult(JSON.stringify(value, null, 2));
  }, []);

  return (
    <section>
      <h2>Protected form (iframe)</h2>
      <ProtectedForm
        vaultURL={vaultURL}
        apiKey={apiKey}
        collection="credit_cards"
        expiration={15 * 60} // 15 minutes
        fields={fields}
        submitButton="Submit"
        style={{ theme: 'floating-label' }}
        onSubmit={onSubmit}
        onError={onError}
      />
      {result && <pre>{result}</pre>}
    </section>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
