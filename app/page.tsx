"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import { StorageImage } from '@aws-amplify/ui-react-storage';
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
    let body;
    let trim;
    if (vifid === null) {
      vifid = window.prompt("VIF #");
      body = window.prompt("Body");
      trim = window.prompt("Trim");
    }
    if (vifid === null||body === null||trim === null) { return; }
  
    if (color === null) {
      color = window.prompt("Color");
    }
    if (color === null) { return; }
  
    client.models.Job.create({
      id: vifid + "_" + color.replace(/[^a-zA-Z0-9]/g, '') + "_spin0",
      vifid: vifid,
      body: body,
      trim: trim,
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
        <th>VIF #</th>
        <th>Dataset</th>
        <th>Body</th>
        <th>Trim</th>
        <th>Color</th>
        <th>Angle</th>
        <th>Image</th>
        <th>Workflow</th>
        <th>Workflow Params</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {jobs
        .sort((a, b) => (a.vifid > b.vifid ? 1 : -1))
        .reduce((acc, job, index, array) => {
          if (index === 0 || job.vifid !== array[index - 1].vifid) {
            acc.push({ ...job, rowSpan: array.filter(j => j.vifid === job.vifid).length });
          } else {
            acc.push({ ...job, rowSpan: 0 });
          }
          return acc;
        }, [])
        .map((job, index) => (
          <tr key={index}>
            {job.rowSpan > 0 && (
              <td rowSpan={job.rowSpan}>{String(job.vifid)}</td>
            )}
            <td><button>Upload</button></td>
            <td>{String(job.body)}</td>
            <td>{String(job.trim)}</td>
            <td>{String(job.color)}</td>
            <td>{String(job.angle)}</td>
            <td>{String(job.img)}</td>
            <td>{String(job.workflow)}</td>
            <td>{String(job.workflow_params)}</td>
            <td>
              <button onClick={() => createJob(job.vifid)}>New color</button>
              <button onClick={() => createJob(job.vifid, job.color)}>New angle</button>
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