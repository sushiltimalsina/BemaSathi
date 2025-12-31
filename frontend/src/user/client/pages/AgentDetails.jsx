import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const AgentDetails = () => {
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);

  const agentParam = query.get("agent");
  const policyId = query.get("policy");

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const [loggedInquiry, setLoggedInquiry] = useState(false);

  const token = localStorage.getItem("client_token");
  const isClient = !!token;

  // -----------------------------------
  // 1) BLOCK GUEST ACCESS
  // -----------------------------------
  useEffect(() => {
    if (!isClient) {
      navigate("/login?redirect=agent");
    }
  }, [isClient, navigate]);

  // -----------------------------------
  // 2) FETCH LOGGED IN USER
  // -----------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      if (!isClient) return;

      try {
        const res = await API.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("User fetch failed", err);
      } finally {
        setUserLoaded(true);
      }
    };

    fetchUser();
  }, [isClient, token]);

  // -----------------------------------
  // 3) FETCH AGENT DETAILS
  // -----------------------------------
  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      setError("");

      let resolvedAgentId = agentParam;

      try {
        // If agent param is missing, fetch via policy
        if (!resolvedAgentId && policyId) {
          const policyRes = await API.get(`/policies/${policyId}`);
          resolvedAgentId = policyRes.data?.agent_id;

          if (!resolvedAgentId) {
            throw new Error("No agent assigned to this policy.");
          }
        }

        if (!resolvedAgentId) {
          throw new Error("Invalid agent ID.");
        }

        // Load agent
        const res = await API.get(`/agents/${resolvedAgentId}`);
        setAgent(res.data);
      } catch (err) {
        console.error("Agent fetch error:", err);

        // fallback to first available agent if assigned one fails
        try {
          const listRes = await API.get("/agents");
          const fallback = Array.isArray(listRes.data) ? listRes.data[0] : null;

          if (fallback) {
            setAgent(fallback);
            setError("Assigned agent unavailable. Showing nearest agent.");
          } else {
            setError("Agent not found.");
            setAgent(null);
          }
        } catch (fallbackErr) {
          console.error("Fallback failed:", fallbackErr);
          setError("Agent information unavailable.");
          setAgent(null);
        }
      }

      setLoading(false);
    };

    fetchAgent();
  }, [agentParam, policyId]);

  // -----------------------------------
  // 4) LOG INQUIRY ONLY ONCE
  // -----------------------------------
  useEffect(() => {
    const logInquiry = async () => {
      if (!isClient) return;
      if (!policyId) return;
      if (!userLoaded) return;
      if (loggedInquiry) return;

      try {
        await API.post(
          "/agent-inquiries",
          { policy_id: policyId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Inquiry log failed", err);
      } finally {
        setLoggedInquiry(true);
      }
    };

    logInquiry();
  }, [isClient, policyId, user, userLoaded, loggedInquiry, token]);

  // -----------------------------------
  // LOADING / ERROR / NO AGENT STATES
  // -----------------------------------
  if (!isClient) return null;

  if (loading) {
    return (
      <p className="text-center mt-20 text-text-light dark:text-text-dark opacity-80">
        Loading agent details...
      </p>
    );
  }

  if (!agent) {
    return (
      <p className="text-center mt-20 text-red-500 dark:text-red-400 font-medium">
        {error || "Agent not found."}
      </p>
    );
  }

  // -----------------------------------
  // MAIN RENDER
  // -----------------------------------
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark px-6 py-10 max-w-4xl mx-auto text-text-light dark:text-text-dark transition-colors">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-light dark:text-text-dark hover:text-primary-light dark:hover:text-primary-dark mb-6 transition"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold mb-8">Agent Details</h1>

      {/* AGENT CARD */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm p-8 flex flex-col md:flex-row gap-8 transition-colors">
        {/* LEFT - AVATAR */}
        <div>
          <div className="w-28 h-28 rounded-full bg-primary-light/15 dark:bg-primary-dark/20 flex items-center justify-center text-primary-light dark:text-primary-dark text-4xl font-bold">
            {agent?.name?.charAt(0)}
          </div>
        </div>

        {/* RIGHT - INFO */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{agent.name}</h2>
          <p className="text-sm opacity-70 mt-1">Official Insurance Agent</p>

          {/* CONTACT SECTION */}
          <div className="mt-6 space-y-3 text-sm">
            {/* PHONE */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light/10 dark:bg-primary-dark/20 flex items-center justify-center">
                <PhoneIcon className="w-5 h-5 text-primary-light dark:text-primary-dark" />
              </div>
              <a
                href={`tel:${agent.phone}`}
                className="font-semibold hover:text-primary-light dark:hover:text-primary-dark"
              >
                {agent.phone}
              </a>
            </div>

            {/* EMAIL */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-light/20 dark:bg-info-dark/20 flex items-center justify-center">
                <EnvelopeIcon className="w-5 h-5 text-info-light dark:text-info-dark" />
              </div>
              <a
                href={`mailto:${agent.email}`}
                className="font-semibold hover:text-info-light dark:hover:text-info-dark"
              >
                {agent.email}
              </a>
            </div>
          </div>

          <p className="text-xs opacity-70 mt-6 leading-relaxed">
            This agent will assist you with choosing a policy, purchase
            procedure, documentation, and claims support. Contact the agent
            directly for any guidance.
          </p>
        </div>
      </div>

      </div>
  );
};

export default AgentDetails;

