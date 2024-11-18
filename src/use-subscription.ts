import { useCallback, useEffect } from "react";
import { Store } from "./Store";
import { createClient } from "graphql-ws";
import { fetchAndUpdateBalances } from "./graphql";

// Swap url protocol from http(s) to ws(s)
function httpToWs(url: string): string {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol === "http:") {
    parsedUrl.protocol = "ws:";
  } else if (parsedUrl.protocol === "https:") {
    parsedUrl.protocol = "wss:";
  }

  return parsedUrl.toString();
}

export const useSubscription = (store: Store) => {
  const handleBalanceChangeAlert = useCallback(() => {
    fetchAndUpdateBalances(store);
  }, [store]);

  useEffect(() => {
    if (!store.loggedIn?.sessionId) return;
    const httpUrl = import.meta.env.VITE_GRAPHQL_URL;
    if (!httpUrl) return;

    const client = createClient({
      url: httpToWs(httpUrl),
      connectionParams: {
        authorization: `session:${store.loggedIn.sessionId}`,
      },
    });

    const dispose = client.subscribe(
      {
        query: `
          subscription BalanceChangeAlert {
            caasBalanceAlert {
              currencyKey
            }
          }
        `,
      },
      {
        next: (event) => {
          // event is { data: { caasBalanceChangeAlert {currencyKey} } }
          const currencyKey: string | null =
            (event.data?.caasBalanceAlert as { currencyKey?: string })
              ?.currencyKey ?? null;
          if (!currencyKey) {
            console.error("No currencyKey in event:", event);
            return;
          }
          handleBalanceChangeAlert(/* TODO: pass in currencyKey */);
        },
        error: (error) => {
          console.error("Error during WebSocket subscription:", error);
        },
        complete: () => {
          console.log("Subscription complete");
        },
      }
    );

    return () => {
      console.log("[useBalanceChangeAlertSubscription] disposing");
      dispose();
      client.dispose();
    };
  }, [
    // Very importion to do a deep dep since we only want websocket to connect on initial sessionId=(undefined -> string) transition
    store.loggedIn?.sessionId,
    // Must be stable
    handleBalanceChangeAlert,
  ]);
};
