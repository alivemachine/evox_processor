
import { generateClient } from 'aws-amplify/data';
import { Amplify } from "aws-amplify";
import type { Schema } from "./../data/resource"
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);


export const handler: Schema["runWorkflow"]["functionHandler"] = async (event) => {
    
    const client = generateClient<Schema>();

    const { name } = event.arguments
    // Access Workflows
    const workflowsResult = await client.models.Workflow.list();
    const workflows = workflowsResult.data;

    // Access Jobs
    const jobsResult = await client.models.Job.list();
    const jobs = jobsResult.data;
}