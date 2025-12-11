import { useNavigate } from "react-router-dom";
import { useCompare } from "../../../context/CompareContext";

const CompareBar = () => {
  const { compare, removeFromCompare } = useCompare();
  const navigate = useNavigate();

  const onComparePage =
    window.location.pathname.startsWith("/client/compare") ||
    window.location.pathname.startsWith("/compare");

  if (compare.length === 0 || onComparePage) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark border-t border-border-light dark:border-border-dark shadow-2xl p-4 flex items-center justify-between z-50 transition-colors">
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
              ✕
            </button>
          </div>
        ))}
      </div>

      {compare.length === 2 && (
        <button
          onClick={() =>
            navigate(`/client/compare?p1=${compare[0].id}&p2=${compare[1].id}`)
          }
          className="px-5 py-2 bg-primary-light text-white hover:opacity-90 font-semibold rounded-lg shadow transition"
        >
          Compare Now
        </button>
      )}
    </div>
  );
};

export default CompareBar;
