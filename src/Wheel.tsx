import { useCallback, useEffect, useState } from "react";
import "./Wheel.css";
import { observer } from "mobx-react-lite";
import { playSound } from "./sound";

function getColorForMultiplier(multiplier: number): string {
  // TODO: Prob should just take colors as params along with multiplier list...
  // Client should just calculate them on the fly and guarantee they are unique per multiplier bucket.
  switch (multiplier) {
    case 0:
      // Gray
      return "#808080";
    case 1.5:
      // Green
      // return "#33AA33";
      // return "#4CAF50";
      return "#2ECC71";
    case 1.7:
    case 1.9:
    case 1.2:
      // Cyan
      // return "#00FFFF";

      // return "#00BCD4";
      return "#17A2B8";
    case 2.0:
      // Yellow
      return "#E1C875";
    case 3.0:
      // Violet
      return "#EE82EE";
    case 4.0:
      // Orange
      return "#FFA500";
    case 5.0:
      // Blue
      return "#0000FF";
    case 9.9:
    case 49.5:
      // Red
      return "#FF0000";
    default:
      throw new Error(`Unknown multiplier: ${multiplier}`);
  }
}

export type WheelProps = {
  multipliers: number[];
  targetIndex: number | null;
  onCompleted?: () => void;
  nonce: number;
};

const Wheel: React.FC<WheelProps> = observer(
  ({ multipliers, targetIndex, onCompleted, nonce }) => {
    const [spinning, setSpinning] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [landedMultiplier, setLandedMultiplier] = useState(0);
    // Start in middle of 0th segment
    const [rotation, setRotation] = useState(360 / multipliers.length / 2);

    // Stop showing prev result when user changes the wheel
    useEffect(() => {
      setShowResult(false);
    }, [multipliers]);

    const spinWheel = useCallback(
      (targetIndex: number) => {
        if (spinning) return;
        playSound("bet");
        setSpinning(true);
        setShowResult(false);

        // Calculate the target rotation
        const segmentAngle = 360 / multipliers.length;
        const currentRotation = rotation % 360;
        const targetRotation =
          360 -
          (targetIndex * segmentAngle +
            // Land on the center of the segment
            segmentAngle / 2);

        // Calculate how many degrees we need to rotate to get from current position to target
        let degreesToTarget = targetRotation - currentRotation;

        // Ensure we're always rotating forward by adding 360 if needed
        if (degreesToTarget < 0) {
          degreesToTarget += 360;
        }
        // Final rotation will be current position + 3 full rotations + degrees to target
        const finalRotation = rotation + 360 * 3 + degreesToTarget;

        setRotation(finalRotation);

        // Reset spinning state after animation completes
        setTimeout(() => {
          setSpinning(false);
          setShowResult(true);
          setLandedMultiplier(multipliers[targetIndex]);
          if (multipliers[targetIndex] > 0) {
            playSound("win");
          }
          onCompleted?.();
        }, 1000); // Match this with CSS transition duration
      },
      [multipliers, rotation, spinning, onCompleted]
    );

    useEffect(() => {
      if (targetIndex !== null && !spinning) {
        spinWheel(targetIndex);
      }
    }, [targetIndex, nonce]);

    const radius = 180;
    const strokeWidth = 20;
    const center = 200;
    return (
      <>
        <div className="WheelComponent">
          <div className="wheel-container">
            {showResult && (
              <div
                className="result-display"
                style={{
                  backgroundColor: getColorForMultiplier(landedMultiplier),
                }}
              >
                {landedMultiplier}x
              </div>
            )}
            <svg
              width="400"
              height="400"
              className={`wheel ${spinning ? "spinning" : ""}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {multipliers.map((multiplier, index) => {
                const segmentAngle = 360 / multipliers.length;
                const startAngle = index * segmentAngle;
                const endAngle = startAngle + segmentAngle;

                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);

                const startX = center + radius * Math.cos(startRad);
                const startY = center + radius * Math.sin(startRad);
                const endX = center + radius * Math.cos(endRad);
                const endY = center + radius * Math.sin(endRad);

                const largeArc = segmentAngle > 180 ? 1 : 0;

                // Path for the segment arc
                const pathData = [
                  `M ${startX} ${startY}`,
                  `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
                ].join(" ");

                // Calculate text position
                const textAngle = startAngle + segmentAngle / 2;
                const textRad = (textAngle - 90) * (Math.PI / 180);
                const textX = center + radius * Math.cos(textRad);
                const textY = center + radius * Math.sin(textRad);

                return (
                  <g key={index}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={getColorForMultiplier(multiplier)}
                      strokeWidth={strokeWidth}
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontWeight="bold"
                      fontSize="14"
                      transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                    >
                      {/* {multiplier}x */}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="wheel-pointer" />
          </div>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              width: "100%",
              justifyContent: "center",
            }}
          >
            {Array.from(new Set(multipliers))
              .sort((a, b) => a - b)
              .map((multiplier) => (
                <div
                  key={multiplier}
                  style={{
                    backgroundColor: getColorForMultiplier(multiplier),
                    width: "100px",
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  {multiplier}x
                </div>
              ))}
          </div>
        </div>
      </>
    );
  }
);

export default Wheel;
