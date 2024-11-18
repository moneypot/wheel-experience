import { useState, useEffect } from "react";
import { Store } from "./Store";
import { AUTHENTICATE, sendGraphQLRequest } from "./graphql";
import { runInAction } from "mobx";

export const useAuthenticate = (store: Store) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      try {
        // Get #userToken from url
        const userToken = new URLSearchParams(
          window.location.hash.slice(1)
        ).get("userToken");

        // Get baseCasinoUrl from iframe parent url
        const casinoBaseUrl = (window.location.ancestorOrigins ?? [])[0];

        if (!userToken) {
          throw new Error("No userToken found in URL");
        }

        if (!casinoBaseUrl) {
          throw new Error("No baseCasinoUrl found in parent URL");
        }

        setLoading(true);
        const result = await sendGraphQLRequest(store, {
          document: AUTHENTICATE,
          variables: {
            userToken,
            casinoBaseUrl,
          },
        });

        const success = result.caasAuthenticate?.success;
        const balances = (
          result.caasAuthenticate?.query?.caasCurrentUser?.balances ?? []
        )
          .flatMap((x) => (x ? [x] : []))
          .map((x) => ({
            amount: x.amount,
            currencyKey: x.currencyKey,
            displayUnitName:
              x.caasCurrencyByCurrencyKeyAndCasinoId!.displayUnitName,
            displayUnitScale:
              x.caasCurrencyByCurrencyKeyAndCasinoId!.displayUnitScale,
          }));
        if (success) {
          runInAction(() => {
            store.loggedIn = {
              sessionId: success.sessionId,
              experienceId: success.experienceId,
              userId: success.userId,
              uname: success.uname,
              selectedCurrencyKey: balances[0]?.currencyKey ?? null,
              balances,
            };
          });
          setSuccess(true);
        } else {
          throw new Error("Authentication failed due to empty response");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, []); // Only run once on mount

  return { error, loading, success };
};
