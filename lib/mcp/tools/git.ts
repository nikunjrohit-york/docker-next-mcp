import simpleGit from 'simple-git';
import path from 'path';

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
const git = simpleGit(repoPath);

console.debug && console.debug(`📁 Git repository path: ${repoPath}`);

export const gitTools = {
    get_recent_commits: async ({ limit = 10 }: { limit?: number }) => {
        try {
            const log = await git.log({ maxCount: limit });
            return log.all.map(c => {
                return {
                    hash: c.hash.substring(0, 7),
                    date: c.date,
                    message: c.message,
                    author_name: c.author_name,
                }
            });
        } catch (e: any) {
            return {
                error: `Error getting commits: ${e.message}`
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
        } catch (e: any) {
            return {
                error: `Error getting status: ${e.message}`
            };
        }
    },
    get_file_content: async ({ path: filePath }: { path: string }) => {
        // Security check: ensure path is within repo
        if (filePath.includes('..')) return {
            error: 'Access denied'
        };
        try {
            return await git.show([`HEAD:${filePath}`]);
        } catch (e: any) {
            return {
                error: `Error reading file: ${e.message}`
            };
        }
    }
};
