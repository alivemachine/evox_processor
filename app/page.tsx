"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { Menu, MenuItem, View } from '@aws-amplify/ui-react';

import { list } from 'aws-amplify/storage';
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [jobs, setJobs] = useState<Array<Schema["Job"]["type"]>>([]);
  const [generatedData, setGeneratedData] = useState<Record<string, any[]>>({});

  
  function listJobs() {
    client.models.Job.observeQuery().subscribe({
      next: async (data) => {
        const jobsData = data.items;
        setJobs([...jobsData]);

        const newGeneratedData: Record<string, any[]> = {};
        for (const job of jobsData) {
          const imageItems = await getGeneratedImages(job.vifid);
          newGeneratedData[job.vifid] = imageItems.items;
        }
        setGeneratedData(newGeneratedData);
      },
    });
  }
  async function getGeneratedImages(vifid: string) {
    try {
      const result = await list({
        path: `vehicles/${vifid}/generated/`,
      });
      return result;
    } catch (error) {
      console.error(`Error fetching generated images for vifid ${vifid}:`, error);
      return { items: [] };
    }
  }
  useEffect(() => {
    listJobs();
  }, []);

  function createJob(vifid: string | null = null, color: string | null = null) {
    let body: string | null = null;
    let trim: string | null = null;
    if (vifid === null) {
      vifid = window.prompt("VIF #", "00000");
      body = window.prompt("Body", "Toyota");
      trim = window.prompt("Trim","Rav4 SUV");
    }
    if (vifid === null||body === null||trim === null) { return; }
  
    if (color === null) {
      color = window.prompt("Color", "silver grey");
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
  async function updateJob(vifid: string, color: string,angle: string,property: string, value: any) {
    const id = vifid + "_"+color.replace(/[^a-zA-Z0-9]/g, '')+"_"+angle;
    const job = {
        id: id,
        [property]: value
    };
    const { data: updatedJob, errors } = await client.models.Job.update(job);
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
        <th>Generated</th>
        <th>Workflow</th>
        <th>Workflow Params</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {jobs
        .sort((a, b) => (a.vifid > b.vifid ? 1 : -1))
        .reduce((acc: Array<Schema["Job"]["type"] & { rowSpan: number }>, job, index, array) => {
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
              <>
                <td rowSpan={job.rowSpan}>{String(job.vifid)}</td>
                <td rowSpan={job.rowSpan}><button>Upload</button></td>
                <td rowSpan={job.rowSpan}>{String(job.body)}</td>
                <td rowSpan={job.rowSpan}>{String(job.trim)}</td>
              </>
            )}
            
            <td>{String(job.color)}</td>
            <td>{String(job.angle)}</td>
            <td>
            {job.img ? <StorageImage alt={job.img} path={job.img} /> : null}
            </td>
            <td>
              <View width="4rem">
                <Menu>
                  {generatedData[job.vifid]?.map((item, idx) => (
                    <MenuItem onClick={() => {
                      if (job.vifid && job.color && job.angle) {
                        updateJob(job.vifid, job.color, job.angle, 'img', item.path);
                      }
                    }} key={idx}>{item.path}</MenuItem>
                  ))}
                </Menu>
              </View>
            </td>
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