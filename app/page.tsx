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
  const [items, setItems] = useState<Array<Schema["Item"]["type"]>>([]);

  function listItems() {
    client.models.Item.observeQuery().subscribe({
      next: (data) => setItems([...data.items]),
    });
  }

  useEffect(() => {
    listItems();
  }, []);

  function createItem() {
    const vifid = window.prompt("VIF #");
    if (vifid !== null) {
      client.models.Item.create({
        vifid: vifid,
        color: {
          angle: {
            img: "https://example.com/image.png",
            workflow: "exampleWorkflow",
            workflow_params: {},
          },
        },
      });
    }
  }

  return (
    <main>
      <h1>My items</h1>
      <button onClick={createItem}>+ new</button>
      <ul>
        {items.map((item) => (
          <li key={item.vifid}>{item.vifid}</li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new item.
        <br />
        <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
          Review next steps of this tutorial.
        </a>
      </div>
    </main>
  );
}