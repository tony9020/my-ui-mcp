import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const serverPath = path.join(here, "server.ts");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");

const EXPECTED_TOOLS = [
  "get_component_bundle",
  "get_component_details",
  "get_design_tokens",
  "list_components",
  "suggest_combination",
  "validate_ui_composition",
];

let stderr = "";
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [tsxCli, serverPath],
  cwd: root,
  stderr: "pipe",
});
transport.stderr?.on("data", (chunk) => {
  stderr += String(chunk);
});

const client = new Client(
  { name: "myui-mcp-smoke-test", version: "1.0.0" },
  { capabilities: {} },
);

function toolText(result) {
  return result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name).sort();
  assert.deepEqual(toolNames, EXPECTED_TOOLS, "all six tools are registered");

  const components = await client.callTool({
    name: "list_components",
    arguments: { limit: 60 },
  });
  assert.equal(components.isError, undefined);
  assert.ok(components.structuredContent.returned >= 50);
  assert.ok(components.structuredContent.total >= 8200, "local plus catalogue records are indexed");
  assert.ok(components.structuredContent.components.some((item) => item.name === "Button"));

  const catalogue = await client.callTool({
    name: "list_components",
    arguments: { kind: "catalogue", limit: 5 },
  });
  assert.equal(catalogue.structuredContent.total, 8157, "all catalogue records are indexed");
  assert.ok(catalogue.structuredContent.components.every((item) => item.origin === "catalogue"));

  const catalogueSearch = await client.callTool({
    name: "list_components",
    arguments: { query: "kanchanasw/sketch-button", limit: 5 },
  });
  assert.equal(catalogueSearch.structuredContent.total, 1);
  assert.equal(catalogueSearch.structuredContent.components[0].slug, "sketch-button");
  assert.equal(catalogueSearch.structuredContent.components[0].author.username, "kanchanasw");

  const primitives = await client.callTool({
    name: "list_components",
    arguments: { category: "ui" },
  });
  assert.ok(primitives.structuredContent.total >= 8, "folder alias ui returns primitives");
  assert.ok(primitives.structuredContent.components.some((item) => item.name === "Input"));

  const landing = await client.callTool({
    name: "list_components",
    arguments: { category: "landing" },
  });
  assert.ok(landing.structuredContent.total >= 5, "folder category landing returns sections");

  const search = await client.callTool({
    name: "list_components",
    arguments: { query: "button" },
  });
  assert.ok(search.structuredContent.total >= 1, "free-text query finds Button");

  const detail = await client.callTool({
    name: "get_component_details",
    arguments: { component_name: "Button" },
  });
  assert.equal(detail.structuredContent.name, "Button");
  assert.ok(Array.isArray(detail.structuredContent.props));
  assert.ok(detail.structuredContent.props.some((prop) => prop.name === "variant"));
  assert.ok(toolText(detail).includes("## Source"));

  const catalogueDetail = await client.callTool({
    name: "get_component_details",
    arguments: { component_name: "kanchanasw/sketch-button" },
  });
  assert.equal(catalogueDetail.structuredContent.origin, "catalogue");
  assert.equal(catalogueDetail.structuredContent.catalogue.author.username, "kanchanasw");
  assert.equal(catalogueDetail.structuredContent.catalogue.license, "MIT");
  assert.ok(catalogueDetail.structuredContent.code.includes("SketchButton"));
  assert.ok(catalogueDetail.structuredContent.usageExamples.length >= 1);
  assert.ok(toolText(catalogueDetail).includes("## Source"));
  assert.ok(catalogueDetail.structuredContent.copyTarget.includes("src/components/ui/"));
  assert.ok(catalogueDetail.structuredContent.copyInstruction.includes("Copy the exact code"));

  const bundle = await client.callTool({
    name: "get_component_bundle",
    arguments: {
      components: ["Button", "Input"],
      requirements: "a small account settings form",
      project_context: "Next.js app with semantic tokens; no existing Button component",
    },
  });
  assert.equal(bundle.structuredContent.components.length, 2);
  assert.ok(bundle.structuredContent.components.some((item) => item.name === "Button"));
  assert.ok(bundle.structuredContent.components.every((item) => item.code.includes("export")));
  assert.ok(bundle.structuredContent.components.every((item) => item.sourceAvailable));
  assert.ok(bundle.structuredContent.install.steps.length >= 4);
  assert.ok(bundle.structuredContent.feedback.questions.length >= 4);
  assert.ok(bundle.structuredContent.styleDecisions.some((item) => item.includes("editor")));
  assert.ok(bundle.structuredContent.replacement.some((item) => item.includes("editor")));
  assert.ok(toolText(bundle).includes("## Components to copy"));
  assert.ok(toolText(bundle).includes("## Install and verify"));
  assert.ok(toolText(bundle).includes("export const Button"));

  const derivedBundle = await client.callTool({
    name: "get_component_bundle",
    arguments: {
      requirements: "a treasury dashboard for reconciling payments",
    },
  });
  assert.ok(derivedBundle.structuredContent.components.length >= 1);
  assert.equal(derivedBundle.structuredContent.brief.selectionSource, "requirements");

  const singleBundle = await client.callTool({
    name: "get_component_bundle",
    arguments: { components: "kanchanasw/sketch-button" },
  });
  assert.equal(singleBundle.structuredContent.components[0].origin, "catalogue");
  assert.ok(singleBundle.structuredContent.components[0].code.includes("SketchButton"));
  assert.equal(singleBundle.structuredContent.components[0].license, "MIT");

  const suggestion = await client.callTool({
    name: "suggest_combination",
    arguments: {
      use_case: "a treasury dashboard for reconciling payments",
      surface_type: "dashboard",
    },
  });
  assert.equal(suggestion.structuredContent.brief.surfaceType, "dashboard");
  assert.ok(suggestion.structuredContent.plan.wireframe.includes("+"));
  assert.ok(suggestion.structuredContent.sections.length > 0);
  assert.ok(suggestion.structuredContent.componentSources.length > 0);
  assert.ok(suggestion.structuredContent.componentSources.every((item) => item.code.length > 0));
  assert.ok(suggestion.structuredContent.scaffold.includes("export default function Page"));
  assert.ok(toolText(suggestion).includes("## Component source to copy"));
  assert.ok(
    toolText(suggestion).includes(
      suggestion.structuredContent.componentSources[0].code.slice(0, 200),
    ),
  );

  for (const tokenType of ["colors", "typography", "spacing", "radius", "shadows", "animations", "all"]) {
    const tokens = await client.callTool({
      name: "get_design_tokens",
      arguments: { token_type: tokenType },
    });
    assert.equal(tokens.structuredContent.token_type, tokenType);
    assert.equal(tokens.structuredContent.meta.sourceFile.includes("globals.css"), true);
  }
  const colors = await client.callTool({
    name: "get_design_tokens",
    arguments: { token_type: "colors" },
  });
  assert.ok(colors.structuredContent.colors.tokens.length > 5);

  const goodCode = `export function Page() {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <h1 className="text-3xl font-medium">Reconcile payments</h1>
        <label htmlFor="account">Account</label>
        <input id="account" className="rounded-md border border-border" />
        <button type="button" className="bg-brand text-primary-foreground">Review transfers</button>
      </main>
    );
  }`;
  const good = await client.callTool({
    name: "validate_ui_composition",
    arguments: { code_snippet: goodCode, file_name: "good.tsx" },
  });
  assert.equal(good.structuredContent.verdict, "pass");

  const badCode = `<div>
    <h1>Build <span className="text-purple-500">faster</span></h1>
    <h4>Features</h4>
    <img src="/x.png" />
    <input placeholder="Email" />
    <button><svg /></button>
    <p className="text-[#ff00ff]">Trusted by 10,000+ users</p>
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 backdrop-blur-md rounded-xl border border-white/10 hover:scale-105 animate-pulse p-4 p-6"></div>
  </div>`;
  const bad = await client.callTool({
    name: "validate_ui_composition",
    arguments: { code_snippet: badCode, file_name: "bad.tsx" },
  });
  assert.equal(bad.structuredContent.verdict, "fail");
  assert.ok(bad.structuredContent.findings.length >= 5);

  const prompt = await client.getPrompt({
    name: "design_layout_guide",
    arguments: {
      use_case: "a landing page for an AI code review tool",
      surface_type: "landing",
    },
  });
  const promptText = prompt.messages
    .flatMap((message) => (message.content.type === "text" ? [message.content.text] : []))
    .join("\n");
  for (const heading of ["## Process", "### 1. Plan", "### 2. Review", "### 3. Build", "### 4. Critique"]) {
    assert.ok(promptText.includes(heading), `prompt includes ${heading}`);
  }
  assert.ok(promptText.includes("## Marketplace catalogue"));
  assert.ok(promptText.includes("8157 marketplace records"));

  const handoffPrompt = await client.getPrompt({
    name: "component_handoff",
    arguments: {
      requirements: "a settings form for a small team",
      components: "Button, Input",
      project_context: "Next.js with existing semantic tokens",
    },
  });
  const handoffPromptText = handoffPrompt.messages
    .flatMap((message) => (message.content.type === "text" ? [message.content.text] : []))
    .join("\n");
  assert.ok(handoffPromptText.includes("# Copy-ready My Ui handoff"));
  assert.ok(handoffPromptText.includes("## Components to copy"));
  assert.ok(handoffPromptText.includes("```tsx"));
  assert.ok(handoffPromptText.includes("## Feedback loop"));

  const handoffQuestions = await client.getPrompt({
    name: "component_handoff",
    arguments: {},
  });
  const handoffQuestionsText = handoffQuestions.messages
    .flatMap((message) => (message.content.type === "text" ? [message.content.text] : []))
    .join("\n");
  assert.ok(handoffQuestionsText.includes("## 1. Ask for the brief"));
  assert.ok(handoffQuestionsText.includes("What are you building"));
  assert.ok(handoffQuestionsText.includes("## Conversation contract"));

  const genericPrompt = await client.getPrompt({
    name: "design_layout_guide",
    arguments: {},
  });
  const genericPromptText = genericPrompt.messages
    .flatMap((message) => (message.content.type === "text" ? [message.content.text] : []))
    .join("\n");
  assert.ok(genericPromptText.includes("No use case was supplied"));

  const resources = await client.listResources();
  const uris = resources.resources.map((resource) => resource.uri);
  for (const uri of ["myui://components", "myui://design-tokens", "myui://design-principles", "myui://handoff", "myui://inventory"]) {
    assert.ok(uris.includes(uri), `resource ${uri} is listed`);
  }

  const registry = await client.readResource({ uri: "myui://components" });
  const registryPayload = JSON.parse(registry.contents[0].text);
  assert.equal(registryPayload.meta.catalogueRecordCount, 8157);
  assert.equal(registryPayload.meta.localComponentCount, 57);
  assert.ok(registryPayload.components.length >= 8200);
  assert.ok(registryPayload.components.some((component) => component.origin === "catalogue"));

  const handoffResource = await client.readResource({ uri: "myui://handoff" });
  assert.ok(handoffResource.contents[0].text.includes("## 1. Ask for the brief"));
  assert.ok(handoffResource.contents[0].text.includes("get_component_bundle"));

  const templates = await client.listResourceTemplates();
  assert.ok(
    templates.resourceTemplates.some((template) => template.uriTemplate === "myui://components/{slug}"),
    "local component detail resource template is listed",
  );
  assert.ok(
    templates.resourceTemplates.some(
      (template) => template.uriTemplate === "myui://catalogue/{author}/{slug}",
    ),
    "catalogue component detail resource template is listed",
  );

  const componentResource = await client.readResource({ uri: "myui://components/button" });
  const componentPayload = JSON.parse(componentResource.contents[0].text);
  assert.equal(componentPayload.name, "Button");
  assert.equal(componentPayload.origin, "local");

  const catalogueResource = await client.readResource({
    uri: "myui://catalogue/kanchanasw/sketch-button",
  });
  const cataloguePayload = JSON.parse(catalogueResource.contents[0].text);
  assert.equal(cataloguePayload.name, "Sketch Button");
  assert.equal(cataloguePayload.origin, "catalogue");
  assert.equal(cataloguePayload.catalogue.author.username, "kanchanasw");

  console.log(
    `PASS tools=${toolNames.length} components=${components.structuredContent.total} catalogue=${catalogue.structuredContent.total} suggestions=${suggestion.structuredContent.sections.length}sections sources=${suggestion.structuredContent.componentSources.length} bundle=${bundle.structuredContent.components.length} prompt=${promptText.length}chars handoff=${handoffPromptText.length}chars resources=${uris.length}`,
  );
} catch (error) {
  console.error("SMOKE TEST FAILED");
  if (stderr.trim()) console.error(stderr.trim());
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
  await transport.close().catch(() => {});
}
