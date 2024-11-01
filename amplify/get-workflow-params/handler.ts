import type { Schema } from "./../data/resource"



export const handler: Schema["getWorkflowParams"]["functionHandler"] = async (event) => {
const { name } = event.arguments
return `Hello, ${name}!`
}