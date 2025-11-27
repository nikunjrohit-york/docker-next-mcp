import fs from 'node:fs';
import simpleGit from 'simple-git';

// Auto-detect repository path
const getRepoPath = () => {
  // In Docker, use mounted volume path
  if (process.env.REPO_PATH) {
    return process.env.REPO_PATH;
  }
  // In development, use current working directory
  return process.cwd();
};

const repoPath = getRepoPath();

// If REPO_PATH doesn't exist inside the container, fall back to process.cwd().
// If neither exists, create a small stub that returns friendly errors instead
// of throwing so the app can function (with limited git features).
type SimpleGitFallback = {
  log: (_opts?: unknown) => Promise<{ all: unknown[] }>;
  status: () => Promise<{
    current: string | undefined;
    modified: string[];
    created: string[];
    deleted: string[];
    renamed: string[];
    staged: string[];
    conflicted: string[];
    isClean: () => boolean;
  }>;
  show: (_args: unknown) => never;
};

let git: ReturnType<typeof simpleGit> | SimpleGitFallback;
if (fs.existsSync(repoPath)) {
  git = simpleGit(repoPath);
} else if (fs.existsSync(process.cwd())) {
  git = simpleGit(process.cwd());
} else {
  // Create a minimal fallback that mirrors the simple-git API methods we use
  git = {
    log: async (_opts?: unknown) => ({ all: [] }),
    status: async () => ({
      current: undefined,
      modified: [],
      created: [],
      deleted: [],
      renamed: [],
      staged: [],
      conflicted: [],
      isClean: () => true,
    }),
    show: (_args: unknown) => {
      throw new Error('Repository not available in container');
    },
  };
}

export const gitTools = {
  get_recent_commits: async ({ limit = 10 }: { limit?: number }) => {
    try {
      const log = await git.log({ maxCount: limit });
      type Commit = { hash: string; date: string; message: string; author_name: string };
      return (log.all as Commit[]).map((c) => {
        return {
          hash: c.hash.substring(0, 7),
          date: c.date,
          message: c.message,
          author_name: c.author_name,
        };
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return {
        error: `Error getting commits: ${error}`,
      };
    }
  },
  get_status: async () => {
    try {
      const status = await git.status();
      return {
        branch: status.current,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        staged: status.staged,
        conflicted: status.conflicted,
        isClean: status.isClean(),
      };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return {
        error: `Error getting status: ${error}`,
      };
    }
  },
  get_file_content: async ({ path: filePath }: { path: string }) => {
    // Security check: ensure path is within repo
    if (filePath.includes('..'))
      return {
        error: 'Access denied',
      };
    try {
      return await git.show([`HEAD:${filePath}`]);
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return {
        error: `Error reading file: ${error}`,
      };
    }
  },
};
