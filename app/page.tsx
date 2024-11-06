"use client";

import { useState, useEffect, SetStateAction } from "react";
import { generateClient } from "aws-amplify/data";
import { ApiError, post } from 'aws-amplify/api';
import { Cache } from 'aws-amplify/utils';
import { StorageImage,FileUploader} from '@aws-amplify/ui-react-storage';
import { Menu, MenuItem, View, MenuButton, Divider,TextField ,TextAreaField,SliderField, Card,
  Button,
  Flex,
  Text,
  Image,
  Loader,
  Icon } from '@aws-amplify/ui-react';
import { list,getUrl } from 'aws-amplify/storage';
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import type { Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();
const angleOptions = [
  "spin0", 
  "spin1",
  "spin2",
  "spin3",
  "spin4",
  "spin5",
  "spin6",
  "spin7",
  "spin8",
  "spin9",
  "spin10",
  "spin11",
  "spin12",
  "spin13",
  "spin14",
  "spin15",
  "spin16",
  "spin17",
  "spin18",
  "spin19",
  "spin20", 
  "spin30", 
  "spin40", 
  "spin50", 
  "spin60", 
  "spin70", 
  "spin80", 
  "spin90", 
  "spin100", 
  "spin110", 
  "spin120", 
  "spin130", 
  "spin140", 
  "spin150", 
  "spin160", 
  "spin170", 
  "spin180", 
  "spin190", 
  "spin200", 
  "spin210", 
  "spin220", 
  "spin230", 
  "spin240", 
  "spin250", 
  "spin260", 
  "spin270", 
  "spin280", 
  "spin290", 
  "spin300", 
  "spin310", 
  "spin320", 
  "spin330", 
  "spin340",
  "spin350"
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
  const [evoxImagesList, setEvoxImagesList] = useState([]);

  async function listEvoxVehicles() {
    const response = await fetch('https://api.evoximages.com/api/v1/vehicles?&pid=9&ptid=595&color_code=GXD&api_key=e3LjTFAQEG4MuaDYzZt8kmgqnysC72UX');
    const result = await response.json();
  
    if (result.statusCode === 200) {
      const filteredData = result.data.filter((vehicle: any) => vehicle.urls && vehicle.urls.length > 0)
                                      .filter((vehicle: any) => JSON.stringify(vehicle).includes("GXD"))
                                      .map((vehicle: any) => {
                                        vehicle.urls = vehicle.urls.filter((url: string) => url.includes("GXD"));
                                        return vehicle;
                                      });

      console.log(filteredData);
      setEvoxImagesList(filteredData);
    } else {
      throw new Error('Failed to fetch vehicles');
    }
  }

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
    setSelectedJob(jobsData[0]?.vifid || 'all');
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
      listEvoxVehicles();
      await getDatabaseData(); 
        await listWorkflows();
    })();
}, []);

    


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
    const fluxCount = (workflow.json as string).toLowerCase().match(/"flux"/g)?.length || 0;
    const sdxlCount = (workflow.json as string).toLowerCase().match(/"sdxl"/g)?.length || 0;
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
        var angleWord = '';
        //change the angleWord in function of digit in job.angle
      if (job.angle?.includes('spin')) {
        const angleDigit = parseInt(job.angle.replace('spin', ''));
        if (angleDigit >= 0 && angleDigit <= 20) {
          angleWord = 'side door, wheel rims with tires';
        } else if (angleDigit >= 20 && angleDigit < 60) {
          angleWord = 'rear 3/4 profile taillight, trunck';
        } else if (angleDigit >= 70 && angleDigit < 100) {
          angleWord = 'rear taillight, trunck with emblem, badge, logo in the middle';
        } else if (angleDigit >= 110 && angleDigit < 150) {
          angleWord = 'rear 3/4 profile taillight, trunck ';
        } else if (angleDigit >= 160 && angleDigit < 190) {
          angleWord = 'side door, wheel rims with tires ';
        } else if (angleDigit >= 200 && angleDigit < 240) {
          angleWord = 'front 3/4 profile, headlight, side mirror ';
        } else if (angleDigit >= 250 && angleDigit < 280) {
          angleWord = 'front grill with emblem, badge, logo in the middle ';
        } else if (angleDigit >= 290 && angleDigit < 320) {
          angleWord = 'front 3/4 profile ';
        } else if (angleDigit >= 330 && angleDigit <= 360) {
          angleWord = 'side, headlight, side mirror ';
        }
      }
        if (key === "positive_prompt") {
            value = job.color + " " + job.body + " " + job.trim + " " +angleWord+ value;
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
        if(key === "stylemap"&&value==='') {
          //value=`vehicles/${job.vifid}/colormaps/style_${padNumber(String(job.angle).replace('spin',''))}.png`;
        }
        if(key === "lora") {
          //choose the file which name includes job.vifid and `diffuserType
          value=`${lorasData['loras']?.find(lora => lora.path.includes(job.vifid) && lora.path.includes(diffuserType))?.path.replace('loras/','') || ''}`;
        }
        inputNodesObject[key] = value;
    });
    return inputNodesObject;
}
async function convertToBase64(imagePath: string, maxSize?: number): Promise<string> {
  // Helper function to fetch image as a Blob
  async function fetchImage(url: string): Promise<Blob> {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      return await response.blob();
  }

  // Helper function to resize image
  function resizeImage(imageBlob: Blob, maxSize: number): Promise<string> {
      return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                  reject(new Error('Failed to get canvas context'));
                  return;
              }

              let { width, height } = img;
              if (width > maxSize || height > maxSize) {
                  if (width > height) {
                      height = Math.round((height * maxSize) / width);
                      width = maxSize;
                  } else {
                      width = Math.round((width * maxSize) / height);
                      height = maxSize;
                  }
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(imageBlob);
      });
  }

  // Determine if the path is an AWS Amplify storage path or a URL
  const isURLPath = imagePath.startsWith('http');
  let imageBlob: Blob;

  if (!isURLPath) {
      // Handle AWS Amplify storage path
      
      const linkToStorageFile = await getUrl({
        path: imagePath,
      });
      imageBlob = await fetchImage(String(linkToStorageFile.url));
  } else {
      // Handle URL
      imageBlob = await fetchImage(imagePath);
  }

  // Resize image if maxSize is provided, otherwise convert directly to base64
  if (maxSize) {
      return await resizeImage(imageBlob, maxSize);
  } else {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
      });
  }
}
  async function runJob(jobid: string, workflowid: string) {
    const workflow = workflows.find((workflow) => workflow.id === workflowid);
    const job = jobs.find((job) => job.id === jobid);
    if (!workflow) { alert(`no workflow`); return {}; }
    if (!job) { throw new Error("Job not found"); }

    const headers = {
      'Authorization': 'Bearer 3SNAT5RZD91RWASMYJ1CONECPKKHZQAGCLOARIGJ',
      'Content-Type': 'application/json'
    };
    const workflowJson = JSON.parse(typeof workflow.json === 'string' ? workflow.json : '{}');
    const workflowParams = getWorkflowParams(jobid, workflowid);

    // Iterate over the keys of workflowJson and update the nodes
    Object.keys(workflowJson).forEach((key) => {
        const node = workflowJson[key];
        if (node._meta && node._meta.title.startsWith("in--")) {
            const paramKey = node._meta.title.replace("in--", "");
            if (paramKey in workflowParams) {
                const firstKey = Object.keys(node.inputs)[0];
                node.inputs[firstKey] = workflowParams[paramKey].split('/').pop();            }
        }
        // Check if the node's title includes 'Sampler' and update its inputs value
        if (node._meta && node._meta.title.includes('Sampler')) {
          Object.keys(node.inputs).forEach(key => {
            if (key.includes('seed')) {
              node.inputs[key] = Math.floor(Math.random() * 10000); // Set a random integer
            }
          });
        }
    });
    // Check if any of the value in workflowParams is an image
    const imageKeys = Object.keys(workflowParams).filter(key => 
      workflowParams[key].endsWith('.png') || 
      workflowParams[key].endsWith('.jpg') || 
      workflowParams[key].endsWith('.jpeg')
    );

    const imageArray = await Promise.all(imageKeys.map(async key => {
      const imagePath = workflowParams[key];  
      const base64String = (await convertToBase64(imagePath, 1024)).replace('data:image/png;base64,',''); // Assuming maxSize is 1024
      return {
          name: imagePath.split('/').pop().replace('.jpg', '.png').replace('.jpeg', '.png'),
          image: base64String
      };
    }));
    //change all image extensions in the json from .jpg to .png
    Object.keys(workflowJson).forEach((key) => {
      const node = workflowJson[key];
      const firstKey = Object.keys(node.inputs)[0];            
                        if (typeof node.inputs[firstKey] === 'string') {              
                node.inputs[firstKey] = node.inputs[firstKey].replace('.jpg', '.png').replace('.jpeg', '.png');
            }
  });
    //uncomment to preview images that are sent to runpod when running a job
    //imageArray.forEach(imageObj => {
    //  const newWindow = window.open();
    //  if (newWindow) {
    //      newWindow.document.write(`<img src="${'data:image/png;base64,'+imageObj.image}" alt="${imageObj.name}" />`);
    //  }
  //});

    // create the images object and add it to the data object
    const data = {
        "input": {
          "workflow": workflowJson,
          images: imageArray,
          file_name: `${job.vifid}/generated/${job.color?.replace(/[^a-zA-Z]/g, '')}_${job.angle}`,    
        }};
        console.log(data);

    try {
      const initialResponse = await fetch(`https://api.runpod.ai/v2/8w67zxhwn3jsa4/run`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
        
      let initialResponseData = await initialResponse.json();
         // Save the status response in the database
         console.log('Initial RUNPOD response:', initialResponseData);
         
        let status = initialResponseData.status;
        let statusMsg = status;
        if(initialResponseData.retries && status === 'IN_PROGRESS'){
          statusMsg = 'Retry '+initialResponseData.retries;
        }
        updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'status', statusMsg);
        let id = initialResponseData.id;
        let statusResponse;
        let statusResponseData;
        while (status === 'IN_PROGRESS' || status === 'IN_QUEUE') {
            await new Promise(resolve => setTimeout(resolve, initialResponseData.delayTime || 5000)); // Wait for the delay time or 5 seconds
            statusResponse = await fetch(`https://api.runpod.ai/v2/8w67zxhwn3jsa4/status/${id}`, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(data)
            });
            statusResponseData = await statusResponse.json();
            status = statusResponseData.status;
            statusMsg=status;
             // Save the status response in the database
             console.log('Status RUNPOD response:', statusResponseData);
             if(statusResponseData.retries && status === 'IN_PROGRESS'){
              statusMsg = 'Retry '+statusResponseData.retries;
            }
             updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'status', statusMsg);
        }

        if (status === 'error' || (status === 'COMPLETED' && statusResponseData.output.status === 'error')) {
            throw new Error(statusResponseData.output.message || 'Workflow error');
        }

        if (status === 'FAILED') {
            throw new Error(statusResponseData.error || 'Workflow failed');
        }

        const base64Image = statusResponseData.output.message;
        console.log(base64Image);
        const regex = /amazonaws\.com\/.*?\.png/;
        const matchedImage = base64Image.match(regex);


        const cleanedImage = matchedImage[0].replace("amazonaws.com/", "");
        console.log(cleanedImage);

        updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'img', cleanedImage);
        // Add generated image filename to queue.json        
        return { error: false, filePath: base64Image };
    } catch (error) {
        throw new Error(error || 'Workflow failed');
    }
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
                        createJob(job.vifid, job.color, 'spin140');
                        createJob(job.vifid, job.color, 'spin260');
                        createJob(job.vifid, job.color, 'spin300');
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
                                  {
                                    key === 'stylemap' ? (
                                    //make a menu from the evox list to pick the style file
                                    <Menu trigger={<MenuButton className="imgbtn">{value ? <Image  alt={value} src={value} />  : 'no file'}</MenuButton>}>
                                      {evoxImagesList.map((vehicle, idx) => (
                                        <MenuItem
                                          key={idx}
                                          onClick={(e) => {
                                            console.log(job);
                                            console.log(job.workflow_params);
                                            const newParams = JSON.parse(job.workflow_params || '{}');
                                            console.log(newParams);
                                            const angleString = job.angle; // Replace with your random string
                                            console.log(angleString); 
                                            const lastFewDigits = parseInt(angleString.match(/\d+$/)?.[0] || '', 10);
                                            console.log(lastFewDigits); 
                                            const parsedInteger = parseInt(lastFewDigits, 10)/10;     
                                            console.log(parsedInteger);                 
                                            newParams[key] = vehicle.urls[parsedInteger];
                                            console.log(newParams);
                                            updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow_params', newParams);
                                          }}
                                        >
                                          {vehicle.fulltext_search}
                                        </MenuItem>
                                      ))}
                                    </Menu>
                                  ): typeof value === 'string' && (value.includes('.png') || value.includes('.jpg')) ? (
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
                <button onClick={() => runJob(job.id, job.workflow)}>
                  {job.status && (job.status.includes('QUEUE') || job.status.includes('PROGRESS')) ? (
                    <>
                    <Loader size="large" /> {job.status}
                    </>
                  ) : (
                    job.status || 'RUN'
                  )}
                </button>              </td>
            </tr>
          );
        })}
    </tbody>
  </table>
  </div>
</main>
  );
}