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
  Loader,ToggleButton,ToggleButtonGroup,
  Icon } from '@aws-amplify/ui-react';
import { list,getUrl } from 'aws-amplify/storage';
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import type { Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import ImageViewer from './imageViewer';
Amplify.configure(outputs);

const client = generateClient<Schema>();
const angleOptions = [
  "spin0", 
  "spin10",
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
  const [selectedMap, setSelectedMap] = useState('generated');
  const [uploadPath, setUploadPath] = useState('colormaps');
  const [evoxImagesList, setEvoxImagesList] = useState<any[]>([]);
  const [selectedAngle, setSelectedAngle] = useState('spin0');
  const [selectedSetting, setSelectedSetting] = useState(false);
async function listEvoxVehicles() {
    const colorCodes = ['SA', 'SE', 'GXD','17U','C4P','C4W'];//
    let allFilteredData: any[] = [];

    for (const colorcode of colorCodes) {
        const response = await fetch(`https://api.evoximages.com/api/v1/vehicles?&pid=9&ptid=597&color_code=${colorcode}&api_key=e3LjTFAQEG4MuaDYzZt8kmgqnysC72UX`);
        const result = await response.json();

        if (result.statusCode === 200) {
            const filteredData = result.data.filter((vehicle: any) => vehicle.urls && vehicle.urls.length > 0)
                                            .filter((vehicle: any) => JSON.stringify(vehicle).includes(colorcode))
                                            .map((vehicle: any) => {
                                                vehicle.urls = vehicle.urls.filter((url: string) => url.includes(colorcode));
                                                return vehicle;
                                            });
                                            console.log(filteredData);
            allFilteredData = allFilteredData.concat(filteredData);
        } else {
            throw new Error(`Failed to fetch vehicles for color code ${colorcode}`);
        }
    }

    console.log(allFilteredData);
    setEvoxImagesList(allFilteredData);
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
    var workflow = '';
    //if the digits in angle don't amount to 0
    if(parseInt(angle.replace('spin',''))!==0){
      //then attribute the same workflow as the job which has same vifid and angle spin0
      const spin0Job = jobs.find((job) => job.vifid === vifid && job.angle === 'spin0');
      workflow = spin0Job?.workflow ?? '';
      console.log(workflow);
    }
    client.models.Job.create({
      id: vifid + "_" + color.replace(/[^a-zA-Z0-9]/g, '') + "_"+angle,
      vifid: vifid,
      body: body,
      trim: trim,
      color: color,
      angle: angle,
      workflow: workflow,
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
          angleWord = 'side door ';
        } else if (angleDigit >= 20 && angleDigit < 60) {
          angleWord = 'rear 3/4 profile ';
        } else if (angleDigit >= 70 && angleDigit < 100) {
          angleWord = 'rear ';
        } else if (angleDigit >= 110 && angleDigit < 150) {
          angleWord = 'rear 3/4 profile ';
        } else if (angleDigit >= 160 && angleDigit < 190) {
          angleWord = 'side door ';
        } else if (angleDigit >= 200 && angleDigit < 240) {
          angleWord = 'front 3/4 profile ';
        } else if (angleDigit >= 250 && angleDigit < 280) {
          angleWord = 'front grille ';
        } else if (angleDigit >= 290 && angleDigit < 320) {
          angleWord = 'front 3/4 profile ';
        } else if (angleDigit >= 330 && angleDigit <= 360) {
          angleWord = 'side ';
        }
      }
        if (key === "positive_prompt") {
            value = job.color + " " + job.body + " " + job.trim + " " +angleWord+ value;
        }
        
        //if key exist in job.workflow_params then use its value
        if (job.workflow_params) {
            const workflowParams = JSON.parse(job.workflow_params as string);
            if (workflowParams[key]) {
                value = workflowParams[key];
            }
        }
        //if key === colormaps or depthmaps or stylemaps then use the latest image from the folder
const padNumber = (num: number | string): string => String(num).padStart(3, '0');
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
          //value=`${lorasData['loras']?.find(lora => lora.path.includes(job.vifid) && lora.path.includes(diffuserType))?.path.replace('loras/','') || ''}`;
        }
        if (key === "positive_prompt") {
          //console.log(value);
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
      'Authorization': 'Bearer DCC5ZMJVF6Z83OW8Q5889LZWRWQ4EICI295SZF2K',
      'Content-Type': 'application/json'
  };
  var bodyData;
  let parsedStatus;
  try {
      parsedStatus = JSON.parse(job.status);
  } catch (e) {
      parsedStatus = { status: 'FAILED',id:'' };
  }
  let id;
        let statusResponse;
        let statusResponseData;
        let status ;
        let statusMsg ;
        let delayTime = 10000;
  if (parsedStatus.status === 'COMPLETED' || parsedStatus.status === 'FAILED' || parsedStatus.status === 'CANCELLED') {
    try {
      const workflowJson = JSON.parse(typeof workflow.json === 'string' ? workflow.json : '{}');
      const workflowParams = getWorkflowParams(jobid, workflowid);
      console.log(workflowParams);
      // Iterate over the keys of workflowJson and update the nodes
      Object.keys(workflowJson).forEach((key) => {
          const node = workflowJson[key];
          if (node._meta && node._meta.title.startsWith("in--")) {
              const paramKey = node._meta.title.replace("in--", "");
              if (paramKey in workflowParams) {
                  const firstKey = Object.keys(node.inputs)[0];
                  if(typeof workflowParams[paramKey] === 'string' && (workflowParams[paramKey].includes('.png')|| workflowParams[paramKey].includes('.jpg')|| workflowParams[paramKey].includes('.jpeg'))){
                    node.inputs[firstKey] = workflowParams[paramKey].split('/').pop();    
                  }else{
                    node.inputs[firstKey] = workflowParams[paramKey];   
                  }
                          }
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
        typeof workflowParams[key] === 'string' && (
          workflowParams[key].endsWith('.png') || 
          workflowParams[key].endsWith('.jpg') || 
          workflowParams[key].endsWith('.jpeg')
        )
      );

      const imageArray = await Promise.all(imageKeys.map(async key => {
        const imagePath = workflowParams[key];  
        const base64String = (await convertToBase64(imagePath, 2048)).replace('data:image/png;base64,',''); // Assuming maxSize is 1024
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
        bodyData = {
          "input": {
            "workflow": workflowJson,
            images: imageArray,
            file_name: `${job.vifid}/generated/${job.color?.replace(/[^a-zA-Z]/g, '')}_${job.angle}`,    
          }};
          console.log(bodyData);
    

      

        const initialResponse = await fetch(`https://api.runpod.ai/v2/8w67zxhwn3jsa4/run`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(bodyData)
        });
          
        let initialResponseData = await initialResponse.json();
          // Save the status response in the database
          console.log('Initial RUNPOD response:', initialResponseData);
          
          status = initialResponseData.status;
          statusMsg = status;
          if(initialResponseData.retries && status === 'IN_PROGRESS'){
            statusMsg = 'Retry '+initialResponseData.retries+' '+status;
          }
          updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'status', initialResponseData);
          id = initialResponseData.id;
      } catch (error) {
        if (error instanceof Error) {
          throw error; // Re-throw if it's already an Error object
        } else if (typeof error === 'string') {
          throw new Error(error);
        } else {
          throw new Error('Workflow failed: ' + JSON.stringify(error));
        }
      }
    }else{
        //use status from job.status if valid
        if (job.status && job.status.trim() !== "") {
          try {
            const parsedStatus = JSON.parse(job.status);
            status = parsedStatus.status;
            id = parsedStatus.id;
          } catch (e) {
              status = 'FAILED';
              updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'status', JSON.stringify({ "status": "FAILED" }));
          }
        }else{
          status = 'FAILED';
          updateJob(job.vifid, job.color ?? '', job.angle ?? '','status', JSON.stringify({ "status": "FAILED"}));
        }
        
      }
      
        
        while (status === 'IN_PROGRESS' || status === 'IN_QUEUE') {
            await new Promise(resolve => setTimeout(resolve, delayTime)); // Wait for the delay time or 5 seconds
            statusResponse = await fetch(`https://api.runpod.ai/v2/8w67zxhwn3jsa4/status/${id}`, {
              method: 'POST',
              headers: headers,
              body: bodyData ? JSON.stringify(bodyData) : null
            });
            statusResponseData = await statusResponse.json();
            status = statusResponseData.status;
            statusMsg=status;
             // Save the status response in the database
             console.log('Status RUNPOD response:', statusResponseData);
             if(statusResponseData.retries && status === 'IN_PROGRESS'){
              statusMsg = 'Retry '+statusResponseData.retries;
            }
             updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'status', statusResponseData);
        }

        if (status === 'error' || (status === 'COMPLETED' && statusResponseData.output.status === 'error')) {
            throw new Error(statusResponseData.output.message || 'Workflow error');
        }

        if (status === 'FAILED') {
          if( statusResponseData.error){
            throw new Error(statusResponseData.error || 'Workflow failed');
          }else{
            throw new Error('Workflow failed: ' + JSON.stringify(statusResponseData));
          }
        }

        const base64Image = statusResponseData.output.message;
        console.log(base64Image);
        const regex = /amazonaws\.com\/.*?\.png/;
        const matchedImage = base64Image.match(regex);


        const cleanedImage = matchedImage[0].replace("amazonaws.com/", "");
        console.log(cleanedImage);

        updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'img', cleanedImage);
        //update the image viewer with the new image
        {filteredJobs.length > 0 && filteredJobs.every(job => job.vifid === filteredJobs[0].vifid) && (
          updateImageViewer(filteredJobs, selectedMap, runCurrentJob,selectedAngle)
        )}
        // Add generated image filename to queue.json        
        return { error: false, filePath: base64Image };
      
}

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
function runCurrentJob(jobid: string) {
  return async () => {
    const job = jobs.find((job) => job.id === jobid);
    if (!job) { throw new Error("Job not found"); }
    const workflowid = job.workflow;
    const { error, filePath } = await runJob(jobid, workflowid);
    if (error) {
      console.error(filePath);
    } else {
      console.log(filePath);
    }
  };
}

// Function to download all the images
async function downloadAllImages(jobs) {
  for (const job of jobs) {
    try {
      // Remove the leading slash if present
      const imagePath = job.img.startsWith('/') ? job.img.slice(1) : job.img;
      
      // Get the signed URL for the image
      const getUrlResult  = await getUrl({ path: imagePath }); // Ensure correct parameter is passed

      // Fetch the image as a blob
      const response = await fetch(getUrlResult.url);
      const blob = await response.blob();

      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = imagePath.split('/').pop(); // Extract the filename from the path
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up the object URL
      }, 100);
    } catch (error) {
      console.error(`Error downloading image: ${job.img}`, error);
    }
  }
}


const updateImageViewer = (filteredJobs, selectedMap, runCurrentJob, angle) => {
console.log(angle);
  const sortedImagePaths = filteredJobs
    .map(job => {
      let imgPath;
      const spinValue = job.angle.match(/spin(\d+)/)[1];
      switch (selectedMap) {
        case 'colormap':
          imgPath = `vehicles/${job.vifid}/colormaps/color_${spinValue.padStart(3, '0')}.png`;
          break;
        case 'depthmap':
          imgPath = `vehicles/${job.vifid}/depthmaps/depth_${spinValue.padStart(3, '0')}.png`;
          break;
        default:
          imgPath = job.img;
      }
      return { img: imgPath, angle: parseInt(spinValue, 10) };
    })
    .sort((a, b) => a.angle - b.angle)
    .map(job => job.img);

  const handleImageChange = (newAngle) => {
    setSelectedAngle(prevAngle => {
      if (prevAngle !== newAngle) {
        console.log(newAngle);
        return newAngle;
      }
      return prevAngle;
    });
  };

  return filteredJobs[0].id && (
    <ImageViewer
      imagePaths={sortedImagePaths}
      onTriggerFunction={() => runCurrentJob(filteredJobs[0].id)}
      onImageChange={handleImageChange}
      angle={angle}
    />
  );
};
const filteredJobs = selectedJob === 'all' ? jobs : jobs.filter(job => job.vifid === selectedJob);

//The queue table is designed to sort the data in the database by vifid, color and angle and then merge the relevant rows by column.
  return (
<main>
  <div>
  <h1>EVOX AI BATCH PROCESSOR</h1>
<Menu trigger={
            <MenuButton size="large">
              {selectedJob + (jobs.find(job => job.vifid === selectedJob)?.body || jobs.find(job => job.vifid === selectedJob)?.trim ? 
                " | " + (jobs.find(job => job.vifid === selectedJob)?.body || '') + " " + (jobs.find(job => job.vifid === selectedJob)?.trim || '') : '')}
            </MenuButton>
          }>
            <MenuItem onClick={() => setSelectedJob('all')}>All</MenuItem>
            {Array.from(new Set(jobs.map(job => job.vifid))).map(vifid => (
              <MenuItem key={vifid} onClick={() => setSelectedJob(vifid)}>
                {vifid + (jobs.find(job => job.vifid === vifid)?.body || jobs.find(job => job.vifid === vifid)?.trim ? 
                  " | " + (jobs.find(job => job.vifid === vifid)?.body || '') + " " + (jobs.find(job => job.vifid === vifid)?.trim || '') : '')}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={() => createJob()}>+ new</MenuItem>
          </Menu>
          <Menu trigger={<MenuButton>{selectedMap}</MenuButton>}>
        <MenuItem onClick={() => setSelectedMap('generated')}>Generated</MenuItem>
        <MenuItem onClick={() => setSelectedMap('colormap')}>Colormap</MenuItem>
        <MenuItem onClick={() => setSelectedMap('depthmap')}>Depthmap</MenuItem>
      </Menu>
  <div className='flipbook'>
      {filteredJobs.length > 0 && filteredJobs.every(job => job.vifid === filteredJobs[0].vifid) && (
       updateImageViewer(filteredJobs, selectedMap, runCurrentJob,selectedAngle)
      )}
    </div>
  <table id="queue-options">
    <tbody>
      <tr>
        <td>
          
        </td>
        <td>

        </td>
        <td>
        <Button onClick={() => setSelectedAngle('all')}>All angles</Button>
        </td>
        <td>
        <ToggleButton
          onClick={() => setSelectedSetting(selectedSetting === true ? false : true)}
        >
          Advanced Mode
        </ToggleButton>
        </td>
        <td>
          <Button onClick={() => downloadAllImages(filteredJobs)}>Download All Images</Button>
        </td>
        <td>
        <Menu trigger={<MenuButton variation="primary">
                      {'Choose a workflow'}</MenuButton>}>
                  {workflows
                    .filter(workflow => workflow.visibility === 'released')
                    .map((workflow, idx) => (

                      <MenuItem key={idx} onClick={() => {
                        //update all the filteredJobs
                        filteredJobs.forEach(job => {
                          updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow', workflow.id)
                        });
                        }}>
                        <div>
                          <div>{workflow.name}</div>
                          <Text fontSize="xs" variation="primary" fontStyle='italic'>{workflow.description}</Text>
                        </div>
                      </MenuItem>
                    ))}
                </Menu>
        </td>
      </tr>
    </tbody>
  </table>






   <table id="queue-table">
    <thead>
      <tr>
        {selectedAngle === 'all' && selectedSetting === true && <th></th>}
        {selectedAngle === 'all' && selectedSetting === true && <th>Dataset</th>}
        {selectedAngle === 'all' && <th>Color</th>}
        <th>Angle</th>
        {selectedSetting === true && <th>Image</th>}
        <th>Workflow</th>
        {selectedSetting === true && <th>Workflow Params</th>}
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
            <tr key={index} style={{ display: selectedAngle === 'all' || job.angle === selectedAngle ? 'table-row' : 'none' }}>
              {isFirstRowForVifid && (
                <>
                  <td style={{ display: selectedAngle === 'all' && selectedSetting ===true ?  'table-cell' : 'none' }} rowSpan={rowSpan}>{job.vifid} {job.body} {job.trim}</td>
                  <td style={{ display: selectedAngle === 'all' && selectedSetting ===true ? 'table-cell' : 'none' }} rowSpan={rowSpan}>
                 
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
                      }}}/>
                    </td>
                </>
              )}
              
              {isFirstRowForColor && (
                <>
                  <td style={{ display: selectedAngle != 'all' ? 'none' : 'table-cell' }} rowSpan={colorRowSpan}>
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
              <td>
              <Button onClick={() => {
                setSelectedAngle(job.angle)
                {filteredJobs.length > 0 && filteredJobs.every(job => job.vifid === filteredJobs[0].vifid) && (
                  updateImageViewer(filteredJobs, selectedMap, runCurrentJob, selectedAngle)
                )}
                }}>{job.angle}</Button>
              
              </td>
              {selectedSetting === true ? (
                job.img ? (
                  <td>
                    <Menu trigger={<MenuButton className="imgbtn">
                      <StorageImage alt={job.img} path={job.img} />
                    </MenuButton>}>
                      {generatedData[job.vifid]?.filter(item => item.path.includes('_' + job.angle + '_')).map((item, idx) => (
                        <MenuItem key={idx} onClick={() => updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'img', item.path)}>
                          {item.path.split('/').pop().replace(/\.[^/.]+$/, '').split('_').pop()}
                        </MenuItem>
                      ))}
                    </Menu>
                  </td>
                ) : (
                  <td>
                    <Menu>
                      {generatedData[job.vifid]?.map((item, idx) => (
                        <MenuItem key={idx} onClick={() => updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'img', item.path)}>
                          {item.path}
                        </MenuItem>
                      ))}
                    </Menu>
                  </td>
                )
              ) : null}
              <td>
                <Menu trigger={<MenuButton variation="primary">
                  {workflows.find(w => w.id === job.workflow)?.name || 'Choose a workflow'}</MenuButton>}>
                  {workflows
                    .filter(workflow => workflow.visibility === 'released')
                    .map((workflow, idx) => (
                      <MenuItem key={idx} onClick={() => { updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow', workflow.id) }}>
                        <div>
                          <div>{workflow.name}</div>
                          <Text fontSize="xs" variation="primary" fontStyle='italic'>{workflow.description}</Text>
                        </div>
                      </MenuItem>
                    ))}
                </Menu>
              </td>
              {selectedSetting === true ? (
                          <td className="workflow-params-cell">
                            {Object.entries(getWorkflowParams(job.id, job.workflow)).map(([key, value], idx) => (
                              <td key={idx} className="workflow-param-cell">
                                <div key={key}>
                                  {
                                    key === 'stylemap' ? (
                                    //make a menu from the evox list to pick the style file
                                      <Menu trigger={<MenuButton className="imgbtn">{value ? <Image alt={value} src={value} /> : 'no file'}</MenuButton>}>
                                      {evoxImagesList.map((vehicle, idx) => (
                                        <MenuItem
                                          key={idx}
                                          onClick={(e) => {
                                            filteredJobs.forEach((job) => {
                                              console.log(job);
                                              console.log(job.workflow_params);
                                              const newParams = JSON.parse(job.workflow_params || '{}');
                                              console.log(newParams);
                                              const angleString = job.angle; // Replace with your random string
                                              console.log(angleString);
                                              const lastFewDigits = parseInt(angleString.match(/\d+$/)?.[0] || '', 10);
                                              console.log(lastFewDigits);
                                              const parsedInteger = parseInt(lastFewDigits, 10) / 10;
                                              console.log(parsedInteger);
                                              newParams[key] = vehicle.urls[parsedInteger];
                                              console.log(newParams);
                                              updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow_params', newParams);
                                            });
                                          }}
                                        >
                                          {vehicle.body} {vehicle.trim}
                                        </MenuItem>
                                      ))}
                                    </Menu>
                                  ): typeof value === 'string' && (value.includes('.png') || value.includes('.jpg')) ? (
                                    //display only image from vehicle/job.vifid/[key]/[angle].png folder
                                    <StorageImage alt={value} path={value} />
                                    
                                  ) : key === 'lora' ? (
                                    //make a menu from the lorasData to pick the lora file
                                    <Menu trigger={<MenuButton>{value ? value : 'no lora'}</MenuButton>}>
                                      {Object.values(lorasData)
                                        .flat()
                                        .filter((lora) => lora.path.includes(job.vifid))
                                        .map((lora, idx) => (
                                          <MenuItem 
                                          key={idx}
                                          onClick={() => {
                                            
                                            filteredJobs.forEach((job) => {
                                              const newParams = JSON.parse(job.workflow_params || '{}');
                                              newParams[key] = lora.path.replace('loras/', '');
                                              updateJob(job.vifid, job.color ?? '', job.angle ?? '', 'workflow_params', newParams);
                                            });
                                          }}
                                          >
                                            {lora.path.replace('loras/', '')}
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
        ) : null}
              <td>
                  <Button
                      variation="primary"
                      colorTheme={() => {
                          let parsedStatus;
                          try {
                              parsedStatus = JSON.parse(job.status);
                          } catch (e) {
                              parsedStatus = { status: 'FAILED' };
                          }
                          return parsedStatus.status === 'IN_PROGRESS' || parsedStatus.status === 'IN_QUEUE' ? 'info' :
                                 parsedStatus.status === 'COMPLETED' ? 'success' :
                                 parsedStatus.status === 'FAILED' || parsedStatus.status === 'CANCELLED' ? 'error' : 'default';
                      }}
                      onClick={() => removeJob(job.id)}
                  >
                      X
                  </Button>
                  <Button
                      variation="primary"
                      colorTheme={() => {
                          let parsedStatus;
                          try {
                              parsedStatus = JSON.parse(job.status);
                          } catch (e) {
                              parsedStatus = { status: 'FAILED'};
                          }
                          return parsedStatus.status === 'IN_PROGRESS' || parsedStatus.status === 'IN_QUEUE' ? 'info' :
                                 parsedStatus.status === 'COMPLETED' ? 'success' :
                                 parsedStatus.status === 'FAILED' || parsedStatus.status === 'CANCELLED' ? 'error' : 'default';
                      }}
                      onClick={() => runJob(job.id, job.workflow)}
                  >
                      {(() => {
                        if (job && job.status) {
                          
                          return job.status; // Convert the object to a string before rendering
                        }else{
                          return 
                        }
                      })()}
                  </Button>
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