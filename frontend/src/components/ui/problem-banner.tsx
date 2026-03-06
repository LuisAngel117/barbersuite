import { type ProblemBannerState } from "@/lib/problem";

type ProblemBannerProps = {
  problem: ProblemBannerState;
};

export function ProblemBanner({ problem }: ProblemBannerProps) {
  return (
    <div className="problem-banner alert" role="alert">
      <div className="problem-banner-copy">
        <strong>{problem.title}</strong>
        <p>{problem.detail}</p>
      </div>
      {problem.code ? <span className="soft-pill problem-code">{problem.code}</span> : null}
    </div>
  );
}
