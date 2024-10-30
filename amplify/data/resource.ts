import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

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
      angle: a.enum(["spin0", "spin20", "spin40", "spin60", "spin80", "spin100", "spin120", "spin140", "spin160", "spin180", "spin200", "spin220", "spin240", "spin260", "spin280", "spin300", "spin320", "spin340"]),
      status: a.enum(["idle", "waiting","uploading", "preparing", "training","ready"]),
      img: a.string(),
      workflow: a.string(),
      workflow_params: a.json(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

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
