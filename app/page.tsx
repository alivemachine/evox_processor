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
    client.models.Item.create({
      id: window.prompt("Item ID"),
      color: {
        angle: {
          img: window.prompt("Image URL"),
          workflow: window.prompt("Workflow"),
          workflow_params: JSON.parse(window.prompt("Workflow Params (JSON)")),
        },
      },
    });
  }

  return (
    <main>
      <h1>My Items</h1>
      <button onClick={createItem}>+ new</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Image</th>
            <th>Workflow</th>
            <th>Workflow Params</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.color.angle.img}</td>
              <td>{item.color.angle.workflow}</td>
              <td>{JSON.stringify(item.color.angle.workflow_params)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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