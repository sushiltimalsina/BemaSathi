import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompare } from "../../../context/CompareContext";

const CompareBar = () => {
  const { compare, removeFromCompare, compareError, clearCompare } =
    useCompare();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const allowed = [
      "/client/policies",
      "/client/dashboard",
      "/client/saved",
      "/policies",
    ];
    if (!allowed.some((path) => location.pathname.startsWith(path))) {
      if (compare.length) {
        clearCompare();
      }
    }
  }, [location.pathname, compare.length, clearCompare]);

  const onComparePage =
    window.location.pathname.startsWith("/client/compare") ||
    window.location.pathname.startsWith("/compare");

  if (compare.length === 0 || onComparePage) return null;

  return (
    <div className="compare-bar fixed bottom-0 left-0 right-0 bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-t border-border-light dark:border-border-dark shadow-2xl p-4 pr-16 sm:pr-24 flex items-center justify-between z-50 transition-colors">
      <div className="flex flex-col gap-2">
        {compareError && (
          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
            {compareError}
          </span>
        )}
        <div className="flex items-center gap-3 flex-wrap">
        {compare.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-hover-light dark:bg-hover-dark border border-border-light dark:border-border-dark"
          >
            <span className="font-semibold">{p.policy_name}</span>
            <button
              className="text-red-500 dark:text-red-300 hover:opacity-80"
              onClick={() => removeFromCompare(p.id)}
              aria-label={`Remove ${p.policy_name} from compare`}
            >
              x
            </button>
          </div>
        ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={clearCompare}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-border-light dark:border-border-dark bg-black/35 dark:bg-slate-200/10 text-slate-700 dark:text-slate-200 hover:bg-hover-light dark:hover:bg-hover-dark transition"
        >
          Clear
        </button>
        {compare.length === 2 && (
        <button
          onClick={() =>
            navigate(`/client/compare?p1=${compare[0].id}&p2=${compare[1].id}`)
          }
          className="px-5 py-2 bg-primary-light text-white hover:opacity-90 font-semibold rounded-lg shadow transition mr-4 sm:mr-6"
        >
          Compare Now
        </button>
        )}
      </div>
    </div>
  );
};

export default CompareBar;
