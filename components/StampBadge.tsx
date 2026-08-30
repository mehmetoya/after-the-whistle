import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type ResultProps = {
  kind: "result";
  result: "W" | "D" | "L";
};

type MotmProps = {
  kind: "motm";
};

type Props = (ResultProps | MotmProps) & { size?: "small" | "regular"; locale: Locale };

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

  const label = t(props.locale).resultLabel[props.result];

  return (
    <span className={`stamp stamp--result stamp--${props.result.toLowerCase()} stamp--${size}`}>
      <span className="stamp__ring" aria-hidden="true" />
      <span className="stamp__text">{props.result}</span>
      {size === "regular" && <span className="stamp__label">{label}</span>}
    </span>
  );
}
