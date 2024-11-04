"use client";

import { useState, useEffect, SetStateAction } from "react";
import { generateClient } from "aws-amplify/data";
import { Cache } from 'aws-amplify/utils';
import { StorageImage,FileUploader} from '@aws-amplify/ui-react-storage';
import { Menu, MenuItem, View, MenuButton, Divider,TextField ,TextAreaField,SliderField, Card,
  Button,
  Flex,
  Text,
  Image,
  Loader,
  Icon } from '@aws-amplify/ui-react';
import { list } from 'aws-amplify/storage';
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import type { Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { get } from "http";

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
  const [colormapsData, setColormapsData] = useState<Record<string, any[]>>({});
  const [depthmapsData, setDepthmapsData] = useState<Record<string, any[]>>({});
  const [stylemapsData, setStylemapsData] = useState<Record<string, any[]>>({});
  const [lorasData, setLorasData] = useState<Record<string, any[]>>({});
  const [workflows, setWorkflows] =  useState<Array<Schema["Workflow"]["type"]>>([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [uploadPath, setUploadPath] = useState('colormaps');


  async function listWorkflows() {
    try {
      const result = await client.models.Workflow.list();
      setWorkflows(result.data);
      console.log(result);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  }
  
  async function getFiles(vifid: string, folder: string) {
    let path = `vehicles/${vifid}/${folder}/`;
    if(folder==='loras'){
      path= `loras/`;
    }
    try {
      const result = await list({
        path: path,
      });
      return result;
    } catch (error) {
      console.error(`Error fetching generated images for vifid ${vifid}:`, error);
      return { items: [] };
    }
  }
  async function listJobs(): Promise<Array<Schema["Job"]["type"]>> {
    return new Promise((resolve) => {
      client.models.Job.observeQuery().subscribe({
        next: async (data) => {
          let jobsData = data.items;
          setJobs([...jobsData]);
          resolve(jobsData);
        },
      });
    });
  }
  async function getDatabaseData() {
    let jobsData: Array<Schema["Job"]["type"]> = await listJobs();

    console.log(jobsData);
        const newGeneratedData: Record<string, any[]> = {}; 
        const newColormapsData: Record<string, any[]> = {};
        const newDepthmapsData: Record<string, any[]> = {};
        const newStylemapsData: Record<string, any[]> = {};
        const newLorasData: Record<string, any[]> = {};
        
        // Remove jobs with identical vifid
        const uniqueJobs = new Map();
        jobsData.forEach(job => {
          uniqueJobs.set(job.vifid, job);
        });
        jobsData = Array.from(uniqueJobs.values());
        for (const job of jobsData) {
          const imageItems = await getFiles(job.vifid,'generated');
          newGeneratedData[job.vifid] = imageItems.items;
          const colormapsItems = await getFiles(job.vifid,'colormaps');
          newColormapsData[job.vifid] = colormapsItems.items;
          const depthmapsItems = await getFiles(job.vifid,'depthmaps');
          newDepthmapsData[job.vifid] = depthmapsItems.items;
          const stylemapsItems = await getFiles(job.vifid,'stylemaps');
          newStylemapsData[job.vifid] = stylemapsItems.items;
        }
        const lorasItems = await getFiles('loras','loras');
        newLorasData['loras'] = lorasItems.items; // Assign the files to a key in the object
        console.log(lorasItems);
        setGeneratedData(newGeneratedData);
        setColormapsData(newColormapsData);
        setDepthmapsData(newDepthmapsData);
        setStylemapsData(newStylemapsData);
        setLorasData(newLorasData);
      }
  useEffect(() => {
    (async () => {
      await getDatabaseData(); 
        await listWorkflows();
    })();
}, []);

    function getWorkflowParams(jobid: string, workflowid: string) {
      const workflow = workflows.find((workflow) => workflow.id === workflowid);
      const job = jobs.find((job) => job.id === jobid);
      if (!workflow) { return {}; }
      if (!job) { throw new Error("Job not found"); }
      const workflowJson = JSON.parse(typeof workflow.json === 'string' ? workflow.json : '{}');
      const nodes = Object.values(workflowJson);
      const inputNodes = nodes.filter((node: any) => node._meta.title.startsWith("in--"));
      
      //flux or sdxl
      //figure out how many flux or sdxl is included in workflow json in string format
      const fluxCount = workflow.json.toLowerCase().match(/"flux"/g)?.length || 0;
      const sdxlCount = workflow.json.toLowerCase().match(/"sdxl"/g)?.length || 0;
      const diffuserType = fluxCount > sdxlCount ? 'flux' : 'sdxl';

      // Accumulate key-value pairs in a single object
      const inputNodesObject: { [key: string]: any } = {};
      inputNodes.forEach((node: any) => {
          const key = node._meta.title.replace("in--", "");
          const inputsEntries = Object.entries(node.inputs);
          let value = inputsEntries.length > 0 ? inputsEntries[0][1] : null;
          if (key in job) {
              value = job[key as keyof typeof job];
          }
          if (key === "positive_prompt") {
              value = job.color + " " + job.body + " " + job.trim + " " + value;
          }
          //if key exist in job.workflow_params then use its value
          if (job.workflow_params) {
              const workflowParams = JSON.parse(job.workflow_params);
              if (workflowParams[key]) {
                  value = workflowParams[key];
              }
          }
          //if key === colormaps or depthmaps or stylemaps then use the latest image from the folder
          const padNumber = (num) => String(num).padStart(3, '0');
          if (key === "colormap"){
            value=`vehicles/${job.vifid}/colormaps/color_${padNumber(String(job.angle).replace('spin',''))}.png`;
          }
          if(key === "depthmap"){
            value=`vehicles/${job.vifid}/depthmaps/depth_${padNumber(String(job.angle).replace('spin',''))}.png`;
          }
          if(key === "stylemap") {
            value=`vehicles/${job.vifid}/stylemaps/style_${padNumber(String(job.angle).replace('spin',''))}.png`;
          }
          if(key === "lora") {
            //choose the file which name includes job.vifid and `diffuserType
            console.log(lorasData);
            value=`${lorasData['loras']?.find(lora => lora.path.includes(job.vifid) && lora.path.includes(diffuserType))?.path || ''}`;
          }
          inputNodesObject[key] = value;
      });
      return inputNodesObject;
  }

  function createJob(vifid: string | null = null, color: string | null = null, angle: string | null = null) {
    let body: string | null = null;
    let trim: string | null = null;
    //totally new, prompt for everything
    if (vifid === null) {
      vifid = window.prompt("VIF #", "00000");
    
      if(body === null){
        body = window.prompt("Body", "Toyota");
      }if (body === null) { return; }
      if(trim === null){
        trim = window.prompt("Trim", "RAV4");
      }if (trim === null) { return; }
    }if (vifid === null) { return; }
    //semi-new, complete missing values with the last job's values
    if(body===null){
      body = jobs.find((job) => job.vifid === vifid)?.body || "Toyota";
    }
    if(trim===null){
      trim = jobs.find((job) => job.vifid === vifid)?.trim || "RAV4";
    
    }
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
  function runJob(id: string) {
    alert('runJob');
  }
  const renameFile = (customFileName: string) => {
    return async ({ file }) => {
      const fileExtension = file.name.split('.').pop();
      
      // Use the custom filename passed as argument
      return file
        .arrayBuffer()
        .then((filebuffer) => window.crypto.subtle.digest('SHA-1', filebuffer))
        .then((hashBuffer) => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray
            .map((a) => a.toString(16).padStart(2, '0'))
            .join('');
          // Use the custom filename instead of the hash
          return { file, key: `${customFileName}.${fileExtension}` };
        });
    };
  };
  async function updateJob(vifid: string, color: string,angle: string,property: string, value: any) {
    const id = vifid + "_"+color.replace(/[^a-zA-Z0-9]/g, '')+"_"+angle;
   
    
    if(property==="workflow_params"){
      //add values to existing workflow_params, no duplicates
      const job = jobs.find((job) => job.id === id);
      if (!job) {throw new Error("Job not found");}
      const workflowParams = JSON.parse(job.workflow_params);
      console.log(value);
      const newWorkflowParams = {...workflowParams, ...value};
      value = JSON.stringify(newWorkflowParams);
    }
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
  <div id="queue-table">
  <h1>EVOX AI BATCH PROCESSOR</h1>
  <table>
    <tbody>
      <tr>
        <td>
          <Menu trigger={<MenuButton>{selectedJob}</MenuButton>}>
            <MenuItem onClick={() => setSelectedJob('all')}>All</MenuItem>
            {Array.from(new Set(jobs.map(job => job.vifid))).map(vifid => (
              <MenuItem key={vifid} onClick={() => setSelectedJob(vifid)}>
                {vifid + (jobs.find(job => job.vifid === vifid)?.body || jobs.find(job => job.vifid === vifid)?.trim ? " | " + (jobs.find(job => job.vifid === vifid)?.body || '') + " " + (jobs.find(job => job.vifid === vifid)?.trim || '') : '')}
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
        <th>Color</th>
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
                  <td rowSpan={rowSpan}>{job.vifid} {job.body} {job.trim}</td>
                  <td rowSpan={rowSpan}>
                 
      <FileUploader
      acceptedFileTypes={uploadPath === 'loras' ? ['.safetensors'] : ['image/*']}
      path={uploadPath === 'loras' ? `loras/` : `vehicles/${job.vifid}/${uploadPath}/`}

      maxFileCount={100}

      //processFile={renameFile({job.vifid}+"_"+{job.color}+"_"+{job.angle})}
      components={{
        Container({ children }) {
          return <Card variation="elevated">{children}</Card>;
        },
        DropZone({ children, displayText, inDropZone, ...rest }) {
          return (
            <Flex
              alignItems="center"
              direction="column"
              padding="medium"
              backgroundColor={inDropZone ? 'primary.10' : ''}
              {...rest}
            >
              <Text>Drop <Menu trigger={<MenuButton>{uploadPath}</MenuButton>}>
             <MenuItem onClick={() => {setUploadPath(`ref-images`)}}>Upload ref images</MenuItem>
             <MenuItem onClick={() => {setUploadPath(`colormaps`)}}>Upload color maps</MenuItem>
             <MenuItem onClick={() => {setUploadPath(`depthmaps`)}}>Upload depth maps</MenuItem>
             <MenuItem onClick={() => {setUploadPath(`stylemaps`)}}>Upload style maps</MenuItem>
             <MenuItem onClick={() => {setUploadPath(`loras`)}}>Upload LoRa .safetensors</MenuItem>

           </Menu>files here</Text>
              <Divider size="small" label="or" maxWidth="10rem" />
              {children}
            </Flex>
          );
        },
        FilePicker({ onClick }) {
          return (
            <button onClick={onClick}>Upload</button>
             
          );
        }}}/></td>
                </>
              )}
              
              {isFirstRowForColor && (
                <>
                  <td rowSpan={colorRowSpan}>
                    <Menu trigger={<MenuButton>{job.color}</MenuButton>}>
                      <MenuItem onClick={() => createJob(job.vifid, job.color)}>Add {job.color} single</MenuItem>
                      <MenuItem onClick={() => {
                        createJob(job.vifid, job.color, 'spin14');
                        createJob(job.vifid, job.color, 'spin26');
                        createJob(job.vifid, job.color, 'spin30');
                      }}>Add {job.color} 3AC</MenuItem>
                      <MenuItem onClick={() => angleOptions.forEach(angle => createJob(job.vifid, job.color, angle))}>Add {job.color} 360</MenuItem>
                      <Divider />
                      <MenuItem onClick={() => createJob(job.vifid)}>New color +</MenuItem>

                    </Menu>
                  </td>
                </>
              )}
    
              <td>{job.angle}</td>
              <td>
                {job.img ? (
                  <Menu trigger={<MenuButton className="imgbtn"><StorageImage alt={job.img} path={job.img} /></MenuButton>}>
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
                <Menu trigger={<MenuButton>{workflows.find(w => w.id === job.workflow)?.name || 'Choose a workflow'}</MenuButton>}>
                  {workflows
                    .filter(workflow => workflow.visibility === 'released')
                    .map((workflow, idx) => (
                      <MenuItem key={idx} onClick={() => {updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow', workflow.id)}}>
                        {workflow.name}
                      </MenuItem>
                    ))}
                </Menu>
              </td>
                          <td className="workflow-params-cell">
                            {Object.entries(getWorkflowParams(job.id, job.workflow)).map(([key, value], idx) => (
                              <td key={idx} className="workflow-param-cell">
                                <div key={key}>
                                  {typeof value === 'string' && (value.includes('.png') || value.includes('.jpg')) ? (
                                    //display only image from vehicle/job.vifid/[key]/[angle].png folder
                                    <StorageImage alt={value} path={value} />
                                    
                                  ) : key === 'lora' ? (
                                    //make a menu from the lorasData to pick the lora file
                                    <Menu trigger={<MenuButton>{value ? value : 'no lora'}</MenuButton>}>                                      
                                    {Object.values(lorasData).flat().map((lora, idx) => (
                                        <MenuItem key={idx}>
                                          {lora.path}
                                        </MenuItem>
                                      ))}
                                    </Menu>
                                  ) : key.includes('prompt') ? (
                                    <TextAreaField
                                      label={key}
                                      value={value}
                                      rows={5}
                                      onChange={(e) => {
                                        const newParams = JSON.parse(job.workflow_params || '{}');
                                        newParams[key] = e.target.value;
                                        updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow_params', newParams);
                                      }}
                                    />
                                  ) : (
                                    <TextField
                                      label={key}
                                      value={value}
                                      onChange={(e) => {
                                        const newParams = JSON.parse(job.workflow_params || '{}');
                                        newParams[key] = e.target.value;
                                        updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow_params', newParams);
                                      }}
                                    />
                                  )}
                                </div>
                              </td>
                            ))}
                          </td>
              <td>
                <button onClick={() => removeJob(job.id)}>X</button>
                <button onClick={() => runJob(job.id)}>RUN</button>
              </td>
            </tr>
          );
        })}
    </tbody>
  </table>
  </div>
</main>
  );
}