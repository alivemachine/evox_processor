"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [jobs, setJobs] = useState<Array<Schema["Job"]["type"]>>([]);

  function listJobs() {
    client.models.Job.observeQuery().subscribe({
      next: (data) => setJobs([...data.items]),
    });
  }

  useEffect(() => {
    listJobs();
  }, []);

  function createJob() {
    const vifid = window.prompt("VIF #");
    if (vifid !== null) {
      client.models.Job.create({
        vifid: vifid,
        color: {
          angle: {
            img: "https://example.com/image.png",
            workflow: "exampleWorkflow",
            workflow_params: {},
          },
        },
      });
    }
  }

  return (
    <main>
      <h1>Jobs</h1>
      <button onClick={createJob}>+ new</button>
      <ul>
        {jobs.map((job) => (
          <li key={job.vifid}>{job.vifid}</li>
        ))}
      </ul>
    </main>
  );
}