import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ProblemBannerState } from "@/lib/problem";

type ProblemBannerProps = {
  problem: ProblemBannerState;
};

export function ProblemBanner({ problem }: ProblemBannerProps) {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive shadow-sm sm:flex-row sm:items-start sm:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
          <AlertTriangle className="size-4" />
        </span>
        <div className="space-y-1">
          <strong className="block font-semibold">{problem.title}</strong>
          <p className="leading-6 text-destructive/80">{problem.detail}</p>
        </div>
      </div>
      {problem.code ? (
        <Badge className="w-fit rounded-full border-destructive/20 bg-destructive/10 text-destructive">
          {problem.code}
        </Badge>
      ) : null}
    </div>
  );
}
