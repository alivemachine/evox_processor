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

  function createJob(vifid: string | null = null, color: string | null = null) {
    if (vifid === null) {
      vifid = window.prompt("VIF #");
    }
    if (vifid === null) { return; }
  
    if (color === null) {
      color = window.prompt("Color");
    }
    if (color === null) { return; }
  
    client.models.Job.create({
      id: vifid + "_" + color.replace(/[^a-zA-Z0-9]/g, '') + "_spin0",
      vifid: vifid,
      color: color,
      angle: "spin0"
    });
  }
  function removeJob(id: string) {
    client.models.Job.delete({ id: id });
  }
  return (
<main>
  <h1>Jobs</h1>
  <button onClick={() => createJob()}>+ new</button>
  <table>
    <thead>
      <tr>
        <th>VIFID</th>
        <th>Color</th>
        <th>Angle</th>
        <th>Image</th>
        <th>Workflow</th>
        <th>Workflow Params</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {jobs.map((job) => (
        <tr key={job.vifid}>
          <td>{String(job.vifid)}</td>
          <td>{String(job.color)}</td>
          <td>{String(job.angle)}</td>
          <td>{String(job.img)}</td>
          <td>{String(job.workflow)}</td>
          <td>{String(job.workflow_params)}</td>
          <td>
            <button onClick={() => createJob(job.vifid)}>New color</button>
            <button onClick={() => removeJob(job.id)}>X</button>
            <button>RUN</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</main>
  );
}