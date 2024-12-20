import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { getWorkflowParams } from "../get-workflow-params/resource"
import { runWorkflow } from "../run-workflow/resource"
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
/*== STEP 1 ===============================================================
The section below creates a database with the structure {"id#":{"color":{"angle":{}}}}.
The authorization rule below specifies that any user authenticated via an API key 
can "create", "read", "update", and "delete" any records.
=========================================================================*/
const schema = a.schema({
  Job: a
    .model({
      vifid: a.string().required(),
      body: a.string(),
      trim: a.string(),
      color: a.string(),
      angle: a.enum(angleOptions),
      status: a.json(),
      img: a.string(),
      workflow: a.string(),
      workflow_params: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

    Workflow: a
    .model({
      name: a.string().required(),
      version: a.integer(),
      visibility: a.enum(["private", "released"]),
      description: a.string(),
      type: a.enum(["base", "upscale","inpaint"]),
      json: a.json().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

      
    getWorkflowParams: a
    .query()
    .arguments({
      name: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(getWorkflowParams)),
    
    //async don't return anything
    runWorkflow: a
    .query()
    .arguments({
      name: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(runWorkflow).async()),
  })
  


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});


/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
