import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Nav,
  Navbar,
} from "react-bootstrap";
import { makeGame } from "./game";
import { Game } from "./game/Game";
import { useStore } from "./Store";
import { useAuthenticate } from "./use-authenticate";
import { observer } from "mobx-react-lite";
import { useSubscription } from "./use-subscription";
import { Risk } from "./__generated__/graphql";
import { MAKE_WHEEL_BET, sendGraphQLRequest } from "./graphql";
import { runInAction } from "mobx";
import WithdrawModal from "./components/WithdrawModal";
import { formatError } from "./util";

// TODO: Dangerously copy-pasted from the server
// This is catastrophic for the user if it desyncs from server.
const Wheels: Record<string, Record<number, number[]>> = {
  LOW: {
    "10": [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
    "30": [
      1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2,
      1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0,
    ],
    "50": [
      1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2,
      1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2,
      1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0, 1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2,
      1.2, 0,
    ],
  },
  MEDIUM: {
    "10": [0, 1.9, 0, 1.5, 0, 2, 0, 1.5, 0, 3],
    "30": [
      0, 2, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0,
      2, 0, 2, 0, 1.7, 0, 4, 0, 1.5,
    ],
    "50": [
      0, 2, 0, 1.5, 0, 1.5, 0, 5, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0, 1.5, 0, 2, 0,
      1.5, 0, 3, 0, 1.5, 0, 1.5, 0, 2, 0, 1.5, 0, 3, 0, 1.5, 0, 2, 0, 1.5, 0, 2,
      0, 2, 0, 1.5, 0, 3, 0, 1.5,
    ],
  },
  HIGH: {
    "10": [0, 0, 0, 0, 0, 0, 0, 0, 0, 9.9],
    "30": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 9.9,
    ],
    "50": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      49.5,
    ],
  },
};

const App = observer(() => {
  const store = useStore();
  const authResult = useAuthenticate(store);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [wagerString, setWagerString] = useState("");
  const [risk, setRisk] = useState<Risk>(Risk.Medium);
  const [segments, setSegments] = useState<10 | 30 | 50>(30);
  const [spinning, setSpinning] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showModal, setShowModal] = useState(false);
  useSubscription(store);

  const multipliers = Wheels[risk][segments];

  useEffect(() => {
    const canvasElement = canvasRef.current!;
    const game = makeGame({ canvasElement, multipliers });
    gameRef.current = game;
  }, []);

  const submitBet = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!store.loggedIn) {
      return;
    }
    if (spinning) {
      return;
    }

    // Reset errors
    setSubmitError("");

    const decimalRegex = /^\d+(\.\d+)?$/;
    if (!decimalRegex.test(wagerString)) {
      setSubmitError("Invalid wager amount");
      return;
    }

    const selectedCurrency = store.loggedIn.balances.find(
      (balance) => balance.currencyKey === store.loggedIn?.selectedCurrencyKey
    );

    if (!selectedCurrency) {
      setSubmitError("Invalid currency");
      return;
    }

    const wagerBaseUnits =
      Number.parseFloat(wagerString) * selectedCurrency.displayUnitScale;

    setSpinning(true);
    sendGraphQLRequest(store, {
      document: MAKE_WHEEL_BET,
      variables: {
        wager: wagerBaseUnits,
        currency: selectedCurrency.currencyKey,
        risk,
        segments,
      },
    })
      .then((result) => {
        console.log("Bet result", result);
        const multiplier = result.makeWheelBet!.multiplier;
        // Now get a random index from multipliers list
        const indexes = [...multipliers.keys()].filter(
          (i) => multipliers[i] === multiplier
        );
        const randomIdx = indexes[Math.floor(Math.random() * indexes.length)];
        return gameRef.current?.stopAt(randomIdx);
      })
      .catch((e) => {
        setSubmitError(formatError(e));
      })
      .finally(() => {
        setSpinning(false);
      });
  };

  const changeSegments = (segments: 10 | 30 | 50) => {
    if (spinning) {
      return;
    }
    setSegments(segments);
    gameRef.current!.setMultipliers(Wheels[risk][segments]);
  };

  const changeRisk = (risk: Risk) => {
    console.log("changeRisk to", risk);
    const multipliers = Wheels[risk][segments];
    console.log("multipliers are now", multipliers);
    if (spinning) {
      return;
    }
    setRisk(risk);
    gameRef.current!.setMultipliers(multipliers);
  };

  const handleCurrencyChange = (e: FormEvent<HTMLSelectElement>) => {
    const currency = e.currentTarget.value;
    runInAction(() => {
      if (store.loggedIn) {
        store.loggedIn.selectedCurrencyKey = currency;
      }
    });
  };

  const handleWagerChange = (e: FormEvent<HTMLInputElement>) => {
    const wager = e.currentTarget.value;
    setWagerString(wager);
  };

  return (
    <>
      {showModal && (
        <WithdrawModal show={showModal} hide={() => setShowModal(false)} />
      )}

      <Container className="vh-100 p-3">
        {authResult.error && <Alert variant="danger">{authResult.error}</Alert>}
        {authResult.loading && <Alert variant="info">Loading...</Alert>}
        {store.loggedIn?.balances.length === 0 && (
          <Alert variant="warning">
            Deposit money into this experience to begin betting.
          </Alert>
        )}
        <Navbar>
          <Nav className="ms-auto">
            <Nav.Link as={Button} onClick={() => setShowModal(true)}>
              Withdraw
            </Nav.Link>
          </Nav>
        </Navbar>
        <Row>
          <Col xs={12} md={4} className="mb-3">
            <Form className="mb-3" onSubmit={submitBet}>
              <Form.Group>
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  onChange={handleCurrencyChange}
                  value={store.loggedIn?.selectedCurrencyKey ?? undefined}
                >
                  {store.loggedIn?.balances.map((balance) => (
                    <option
                      key={balance.currencyKey}
                      value={balance.currencyKey}
                    >
                      {balance.currencyKey}:{" "}
                      {balance.amount / balance.displayUnitScale}{" "}
                      {balance.displayUnitName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-2">
                <Form.Label>Wager</Form.Label>
                <Form.Control
                  type="number"
                  name="wager"
                  inputMode="numeric"
                  placeholder="Enter wager amount"
                  pattern="^\d*\.?\d*$"
                  title="Invalid wager"
                  required
                  value={wagerString}
                  onInput={handleWagerChange}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="mt-2">Risk</Form.Label>
                <Form.Select
                  onChange={(e) => {
                    changeRisk(e.target.value as Risk);
                  }}
                  value={risk}
                >
                  {["LOW", "MEDIUM", "HIGH"].map((r) => (
                    <option key={r} value={r}>
                      {r[0] + r.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="mt-2">Segments</Form.Label>
                <Form.Select
                  onChange={(e) => {
                    const segments = Number(e.target.value) as 10 | 30 | 50;
                    changeSegments(segments);
                  }}
                  value={segments}
                >
                  {[10, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                {submitError && (
                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setSubmitError("")}
                  >
                    {submitError}
                  </Alert>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  className={"w-100 " + (spinning ? "disabled" : "")}
                >
                  Bet
                </Button>
              </Form.Group>
            </Form>
          </Col>

          <Col xs={12} md={8} style={{ textAlign: "center" }}>
            <div
              style={{
                width: "100%",
                maxWidth: "550px",
                margin: "0 auto",
                height: "550px",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  height: "auto",
                  pointerEvents: "none",
                }}
              />
            </div>
          </Col>
        </Row>
        {import.meta.env.DEV && <pre>{JSON.stringify(store, null, 2)}</pre>}
      </Container>
    </>
  );
});

export default App;
