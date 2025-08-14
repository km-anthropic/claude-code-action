import { $ } from "bun";
import { homedir } from "os";
import { readFile } from "fs/promises";

export async function setupClaudeCodeSettings(
  settingsInput?: string,
  homeDir?: string,
  slashCommandsDir?: string,
) {
  const home = homeDir ?? homedir();
  const settingsPath = `${home}/.claude/settings.json`;
  console.log(`Setting up Claude settings at: ${settingsPath}`);

  // Ensure .claude directory exists
  console.log(`Creating .claude directory...`);
  await $`mkdir -p ${home}/.claude`.quiet();

  let settings: Record<string, unknown> = {};
  try {
    const existingSettings = await $`cat ${settingsPath}`.quiet().text();
    if (existingSettings.trim()) {
      settings = JSON.parse(existingSettings);
      console.log(
        `Found existing settings:`,
        JSON.stringify(settings, null, 2),
      );
    } else {
      console.log(`Settings file exists but is empty`);
    }
  } catch (e) {
    console.log(`No existing settings file found, creating new one`);
  }

  // Handle settings input (either file path or JSON string)
  if (settingsInput && settingsInput.trim()) {
    console.log(`Processing settings input...`);
    let inputSettings: Record<string, unknown> = {};

    try {
      // First try to parse as JSON
      inputSettings = JSON.parse(settingsInput);
      console.log(`Parsed settings input as JSON`);
    } catch (e) {
      // If not JSON, treat as file path
      console.log(
        `Settings input is not JSON, treating as file path: ${settingsInput}`,
      );
      try {
        const fileContent = await readFile(settingsInput, "utf-8");
        inputSettings = JSON.parse(fileContent);
        console.log(`Successfully read and parsed settings from file`);
      } catch (fileError) {
        console.error(`Failed to read or parse settings file: ${fileError}`);
        throw new Error(`Failed to process settings input: ${fileError}`);
      }
    }

    // Merge input settings with existing settings
    settings = { ...settings, ...inputSettings };
    console.log(`Merged settings with input settings`);
  }

  // Always set enableAllProjectMcpServers to true
  settings.enableAllProjectMcpServers = true;
  console.log(`Updated settings with enableAllProjectMcpServers: true`);

  await $`echo ${JSON.stringify(settings, null, 2)} > ${settingsPath}`.quiet();
  console.log(`Settings saved successfully`);

  if (slashCommandsDir) {
    console.log(
      `Copying slash commands from ${slashCommandsDir} to ${home}/.claude/`,
    );
    try {
      await $`test -d ${slashCommandsDir}`.quiet();
      await $`cp ${slashCommandsDir}/*.md ${home}/.claude/ 2>/dev/null || true`.quiet();
      console.log(`Slash commands copied successfully`);
    } catch (e) {
      console.log(`Slash commands directory not found or error copying: ${e}`);
    }
  }

  // Copy subagent files from repository to Claude's agents directory
  // CLAUDE_WORKING_DIR is set by the action to point to the repo being processed
  const workingDir = process.env.CLAUDE_WORKING_DIR || process.cwd();
  const repoAgentsDir = `${workingDir}/.claude/agents`;
  const targetAgentsDir = `${home}/.claude/agents`;
  
  try {
    const agentsDirExists = await $`test -d ${repoAgentsDir}`.quiet().nothrow();
    if (agentsDirExists.exitCode === 0) {
      console.log(`Found subagents directory at ${repoAgentsDir}`);
      
      // Create target agents directory if it doesn't exist
      await $`mkdir -p ${targetAgentsDir}`.quiet();
      console.log(`Created target agents directory at ${targetAgentsDir}`);
      
      // Copy all .md files from repo agents to Claude's agents directory
      const copyResult = await $`cp -r ${repoAgentsDir}/*.md ${targetAgentsDir}/ 2>/dev/null`.quiet().nothrow();
      
      if (copyResult.exitCode === 0) {
        // List copied agents for logging
        const agents = await $`ls -la ${targetAgentsDir}/*.md 2>/dev/null | wc -l`.quiet().text();
        const agentCount = parseInt(agents.trim()) || 0;
        console.log(`Successfully copied ${agentCount} subagent(s) to ${targetAgentsDir}`);
      } else {
        console.log(`No subagent files found in ${repoAgentsDir}`);
      }
    } else {
      console.log(`No subagents directory found at ${repoAgentsDir}`);
    }
  } catch (e) {
    console.log(`Error handling subagents: ${e}`);
  }
}
