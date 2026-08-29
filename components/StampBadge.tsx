type ResultProps = {
  kind: "result";
  result: "W" | "D" | "L";
};

type MotmProps = {
  kind: "motm";
};

type Props = (ResultProps | MotmProps) & { size?: "small" | "regular" };

const RESULT_LABEL: Record<"W" | "D" | "L", string> = {
  W: "GALİBİYET",
  D: "BERABERLİK",
  L: "MAĞLUBİYET",
};

export default function StampBadge(props: Props) {
  const size = props.size ?? "regular";

  if (props.kind === "motm") {
    return (
      <span className={`stamp stamp--motm stamp--${size}`}>
        <span className="stamp__ring" aria-hidden="true" />
        <span className="stamp__text">MOTM</span>
      </span>
    );
  }

  return (
    <span className={`stamp stamp--result stamp--${props.result.toLowerCase()} stamp--${size}`}>
      <span className="stamp__ring" aria-hidden="true" />
      <span className="stamp__text">{props.result}</span>
      {size === "regular" && <span className="stamp__label">{RESULT_LABEL[props.result]}</span>}
    </span>
  );
}
