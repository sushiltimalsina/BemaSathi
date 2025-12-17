import React, { useEffect, useState } from "react";
import API from "../../../api/api";
import RenewalCard from "../components/RenewalCard";

const MyPolicies = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPolicies = async () => {
    try {
      const res = await API.get("/my-requests");
      setRequests(res.data || []);
    } catch (err) {
      console.log(err);
      setError("Unable to load your policies.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  if (loading)
    return (
      <div className="text-center mt-14 text-text-light dark:text-text-dark">
        Loading your policies...
      </div>
    );

  if (error)
    return (
      <div className="text-center mt-14 text-red-500 dark:text-red-400">
        {error}
      </div>
    );

  if (requests.length === 0)
    return (
      <div className="text-center mt-14 text-text-light dark:text-text-dark">
        You have no purchased policies yet.
      </div>
    );

  return (
    <div
      className="
        min-h-screen px-6 py-10 max-w-6xl mx-auto
        text-text-light dark:text-text-dark
        bg-background-light dark:bg-background-dark
      "
    >
      <h1 className="text-3xl font-bold mb-8">My Policies</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((req) => (
          <RenewalCard key={req.id} request={req} />
        ))}
      </div>
    </div>
  );
};

export default MyPolicies;
