"use client";

import { useState, useEffect, SetStateAction } from "react";
import { generateClient } from "aws-amplify/data";
import { Cache } from 'aws-amplify/utils';
import { StorageImage } from '@aws-amplify/ui-react-storage';
import { Menu, MenuItem, View, MenuButton, Divider } from '@aws-amplify/ui-react';
import { list } from 'aws-amplify/storage';
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();
const angleOptions = [
  "spin0", 
  "spin20", 
  "spin40", 
  "spin60", 
  "spin80", 
  "spin100", 
  "spin120", 
  "spin140", 
  "spin160", 
  "spin180", 
  "spin200", 
  "spin220", 
  "spin240", 
  "spin260", 
  "spin280", 
  "spin300", 
  "spin320", 
  "spin340"
];
export default function App() {
  const [jobs, setJobs] = useState<Array<Schema["Job"]["type"]>>([]);
  const [generatedData, setGeneratedData] = useState<Record<string, any[]>>({});
  const [workflows, setWorkflows] =  useState<Array<Schema["Workflow"]["type"]>>([]);
  const [selectedJob, setSelectedJob] = useState(jobs.length > 0 ? jobs[0].vifid : 'all');

  async function listWorkflows() {
    try {
      const result = await client.models.Workflow.list();
      setWorkflows(result.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  }
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
    listWorkflows();
  }, []);

  function createJob(vifid: string | null = null, color: string | null = null, angle: string | null = null) {
    let body: string | null = null;
    let trim: string | null = null;
    if (vifid === null) {
      vifid = window.prompt("VIF #", "00000");
      body = window.prompt("Body", "Toyota");
      trim = window.prompt("Trim","Rav4 SUV");
    }
    if (vifid === null) { return; }
    if (color === null) {
      color = window.prompt("Color", "silver grey");
    }
    if (color === null) { return; }
    if (angle === null) {
      angle = angleOptions[0];
    }
    client.models.Job.create({
      id: vifid + "_" + color.replace(/[^a-zA-Z0-9]/g, '') + "_"+angle,
      vifid: vifid,
      body: body,
      trim: trim,
      color: color,
      angle: angle
    });
    if(selectedJob!=='all'||selectedJob!==vifid){
      setSelectedJob(vifid);
    }
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

const filteredJobs = selectedJob === 'all' ? jobs : jobs.filter(job => job.vifid === selectedJob);

//The queue table is designed to sort the data in the database by vifid, color and angle and then merge the relevant rows by column.
  return (
<main>
  <h1>Jobs</h1>
  <table>
    <tbody>
      <tr>
        <td>
          <Menu trigger={<MenuButton>{selectedJob}</MenuButton>}>
            <MenuItem onClick={() => setSelectedJob('all')}>All</MenuItem>
            {Array.from(new Set(jobs.map(job => job.vifid))).map(vifid => (
              <MenuItem key={vifid} onClick={() => setSelectedJob(vifid)}>
                {vifid}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={() => createJob()}>+ new</MenuItem>
          </Menu>
        </td>
      </tr>
    </tbody>
  </table>
   <table>
    <thead>
      <tr>
        <th></th>
        <th>Dataset</th>
        <th></th>
        <th>Color</th>
        <th></th>
        <th>Angle</th>
        <th>Image</th>
        <th>Workflow</th>
        <th>Workflow Params</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredJobs
        .sort((a, b) => {
          if (a.vifid !== b.vifid) {
            return a.vifid > b.vifid ? 1 : -1;
          }
          const colorA = a.color ?? '';
          const colorB = b.color ?? '';
          if (colorA !== colorB) {
            return colorA > colorB ? 1 : -1;
          }
          const angleA = a.angle ?? '';
          const angleB = b.angle ?? '';
          return angleA.localeCompare(angleB);
        })
        .map((job, index, array) => {
          const isFirstRowForVifid = index === 0 || job.vifid !== array[index - 1].vifid;
          const isFirstRowForColor = isFirstRowForVifid || job.color !== array[index - 1].color;
          const rowSpan = array.filter((j) => j.vifid === job.vifid).length;
          const colorRowSpan = array.filter((j) => j.vifid === job.vifid && j.color === job.color).length;
    
          return (
            <tr key={index}>
              {isFirstRowForVifid && (
                <>
                  <td rowSpan={rowSpan}>{job.body}{job.trim}</td>
                  <td rowSpan={rowSpan}><button>Upload</button></td>
                  
                  <td rowSpan={rowSpan}>
                    <button onClick={() => createJob(job.vifid)}>New color</button>
                  </td>
                </>
              )}
              
              {isFirstRowForColor && (
                <>
                  <td rowSpan={colorRowSpan}>{job.color}</td>
                  <td rowSpan={colorRowSpan}>
                    <Menu trigger={<MenuButton>New angles</MenuButton>}>
                      <MenuItem onClick={() => createJob(job.vifid, job.color)}>single</MenuItem>
                      <MenuItem onClick={() => {
                        createJob(job.vifid, job.color, 'spin14');
                        createJob(job.vifid, job.color, 'spin26');
                        createJob(job.vifid, job.color, 'spin30');
                      }}>3AC</MenuItem>
                      <MenuItem onClick={() => angleOptions.forEach(angle => createJob(job.vifid, job.color, angle))}>360</MenuItem>
                    </Menu>
                  </td>
                </>
              )}
    
              <td>{job.angle}</td>
              <td>
                {job.img ? (
                  <Menu trigger={<MenuButton><StorageImage alt={job.img} path={job.img} /></MenuButton>}>
                    {generatedData[job.vifid]?.map((item, idx) => (
                      <MenuItem key={idx} onClick={() => updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'img', item.path)}>
                        {item.path}
                      </MenuItem>
                    ))}
                  </Menu>
                ) : (
                  <Menu>
                    {generatedData[job.vifid]?.map((item, idx) => (
                      <MenuItem key={idx} onClick={() => updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'img', item.path)}>
                        {item.path}
                      </MenuItem>
                    ))}
                  </Menu>
                )}
              </td>
              <td>
                <Menu trigger={<MenuButton>{workflows.find(w => w.id === job.workflow)?.name || 'Unknown Workflow'}</MenuButton>}>
                  {workflows.map((workflow, idx) => (
                    <MenuItem key={idx} onClick={() => updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow', workflow.id)}>
                      {workflow.name}
                    </MenuItem>
                  ))}
                </Menu>
              </td>
              <td>{String(job.workflow_params) || ''}</td>
              <td>
                <button onClick={() => removeJob(job.id)}>X</button>
                <button>RUN</button>
              </td>
            </tr>
          );
        })}
    </tbody>
  </table>
</main>
  );
}