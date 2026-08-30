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
      <span className={`pill pill--motm pill--${size}`}>
        <span className="pill__text" aria-hidden="true">
          ★
        </span>
        <span className="pill__label">MOTM</span>
      </span>
    );
  }

  const label = t(props.locale).resultLabel[props.result];

  return (
    <span className={`pill pill--${props.result.toLowerCase()} pill--${size}`}>
      <span className="pill__text">{props.result}</span>
      {size === "regular" && <span className="pill__label">{label}</span>}
    </span>
  );
}
