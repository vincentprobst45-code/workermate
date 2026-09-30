'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main>
          <h1>Une erreur est survenue</h1>
          <p>Rechargez la page ou réessayez dans quelques instants.</p>
        </main>
      </body>
    </html>
  );
}
